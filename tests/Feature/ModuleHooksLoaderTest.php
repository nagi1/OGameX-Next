<?php

use Symfony\Component\Process\Process;

/**
 * Run the host module loader in a shell with an isolated Modules root and statuses
 * file, exactly as the container entrypoint does.
 *
 * @param  array<string, string>  $environment
 * @return array{0: int, 1: string, 2: string}
 */
function runModuleHooksLoader(string $modulesRoot, string $statusesFile, string $body, array $environment = []): array
{
    $loader = base_path('docker/module-hooks.sh');

    $process = new Process(['sh', '-c', '. '.escapeshellarg($loader).'; '.$body], base_path(), array_merge([
        'MODULES_ROOT' => $modulesRoot,
        'MODULES_STATUSES_FILE' => $statusesFile,
    ], $environment));
    $process->run();

    return [$process->getExitCode() ?? 1, $process->getOutput(), $process->getErrorOutput()];
}

/**
 * @param  array<string, bool>  $statuses
 */
function moduleLoaderStatuses(array $statuses): string
{
    $path = sys_get_temp_dir().'/loader_statuses_'.uniqid('', true).'.json';
    file_put_contents($path, json_encode($statuses));

    return $path;
}

/**
 * Build a throwaway Modules root with one module's supervisor fragment.
 */
function moduleLoaderRoot(): string
{
    $root = sys_get_temp_dir().'/modules_root_'.uniqid('', true);
    mkdir($root.'/FakeModule/docker/supervisor', 0777, true);
    mkdir($root.'/FakeModule/docker/entrypoint.d', 0777, true);
    file_put_contents($root.'/FakeModule/docker/supervisor/pool.conf', "[program:fake]\ncommand=fake\n");

    return $root;
}

function removeModuleLoaderTree(string $path): void
{
    if (!is_dir($path)) {
        return;
    }

    $items = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($path, FilesystemIterator::SKIP_DOTS),
        RecursiveIteratorIterator::CHILD_FIRST,
    );

    foreach ($items as $item) {
        $item->isDir() ? rmdir($item->getPathname()) : unlink($item->getPathname());
    }

    rmdir($path);
}

function moduleLoaderTarget(): string
{
    return tempnam(sys_get_temp_dir(), 'supervisor_');
}

test('only an enabled module contributes its supervisor pool', function (): void {
    $root = moduleLoaderRoot();
    $target = moduleLoaderTarget();
    $body = ': > "$TARGET"; append_module_supervisor_config "$TARGET"; cat "$TARGET"';

    [$enabledExit, $enabledOut] = runModuleHooksLoader($root, moduleLoaderStatuses(['FakeModule' => true]), $body, ['TARGET' => $target]);
    [$disabledExit, $disabledOut] = runModuleHooksLoader($root, moduleLoaderStatuses(['FakeModule' => false]), $body, ['TARGET' => $target]);

    expect($enabledExit)->toBe(0)
        ->and($enabledOut)->toContain('[program:fake]')
        ->and($enabledOut)->toContain('contributed by module FakeModule')
        ->and($disabledExit)->toBe(0)
        ->and($disabledOut)->toBe('');

    @unlink($target);
    removeModuleLoaderTree($root);
});

test('a missing status file contributes nothing', function (): void {
    $root = moduleLoaderRoot();
    $target = moduleLoaderTarget();
    $body = ': > "$TARGET"; append_module_supervisor_config "$TARGET"; cat "$TARGET"';

    [$exitCode, $output] = runModuleHooksLoader($root, '/tmp/does-not-exist-'.uniqid('', true).'.json', $body, ['TARGET' => $target]);

    expect($exitCode)->toBe(0)->and($output)->toBe('');

    @unlink($target);
    removeModuleLoaderTree($root);
});

test('entrypoint hooks are sourced only for enabled modules', function (): void {
    $root = moduleLoaderRoot();
    $marker = sys_get_temp_dir().'/loader_marker_'.uniqid('', true);

    file_put_contents($root.'/FakeModule/docker/entrypoint.d/01-hook.sh', ': > '.escapeshellarg($marker)."\n");

    runModuleHooksLoader($root, moduleLoaderStatuses(['FakeModule' => true]), 'run_module_entrypoint_hooks queue');
    expect(is_file($marker))->toBeTrue();

    @unlink($marker);

    runModuleHooksLoader($root, moduleLoaderStatuses(['FakeModule' => false]), 'run_module_entrypoint_hooks queue');
    expect(is_file($marker))->toBeFalse();

    removeModuleLoaderTree($root);
});

test('a non-writable supervisor target is reported and fails', function (): void {
    $root = moduleLoaderRoot();

    [$exitCode, , $stderr] = runModuleHooksLoader(
        $root,
        moduleLoaderStatuses(['FakeModule' => true]),
        'append_module_supervisor_config /nonexistent-dir/out.conf',
    );

    expect($exitCode)->toBe(1)
        ->and($stderr)->toContain('not writable');

    removeModuleLoaderTree($root);
});

test('a non-file fragment is skipped safely', function (): void {
    $root = moduleLoaderRoot();
    mkdir($root.'/FakeModule/docker/supervisor/weird.conf');
    $target = moduleLoaderTarget();
    $body = ': > "$TARGET"; append_module_supervisor_config "$TARGET"; cat "$TARGET"';

    [$exitCode, $output] = runModuleHooksLoader($root, moduleLoaderStatuses(['FakeModule' => true]), $body, ['TARGET' => $target]);

    expect($exitCode)->toBe(0)
        ->and($output)->toContain('[program:fake]')
        ->and($output)->not->toContain('weird.conf');

    @unlink($target);
    removeModuleLoaderTree($root);
});

test('the real AI module contributes its worker pool only while enabled', function (): void {
    $target = moduleLoaderTarget();
    $body = ': > "$TARGET"; append_module_supervisor_config "$TARGET"; cat "$TARGET"';

    [$enabledExit, $enabledOut] = runModuleHooksLoader(base_path('Modules'), moduleLoaderStatuses(['AI' => true]), $body, ['TARGET' => $target]);
    [, $disabledOut] = runModuleHooksLoader(base_path('Modules'), moduleLoaderStatuses(['AI' => false]), $body, ['TARGET' => $target]);

    expect($enabledExit)->toBe(0)
        ->and($enabledOut)->toContain('program:ai-queue-worker')
        ->and($enabledOut)->toContain('--queue=ai,ai-language')
        ->and($disabledOut)->not->toContain('program:ai-queue-worker');

    @unlink($target);
});
