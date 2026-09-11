<?php

use Nwidart\Modules\Facades\Module;
use Nwidart\Modules\Module as ModuleInstance;
use OGame\Modules\ModuleContributionInspector;

/**
 * Resolve a module that must exist for inspection.
 */
function moduleForInspection(string $name = 'HelloWorld'): ModuleInstance
{
    $module = Module::find($name);

    if ($module === null) {
        throw new RuntimeException("Module [{$name}] is not available for inspection.");
    }

    return $module;
}

/**
 * @param  list<array{level: string, message: string}>  $findings
 */
function moduleInspectorHasFinding(array $findings, string $level, string $needle): bool
{
    foreach ($findings as $finding) {
        if ($finding['level'] === $level && str_contains($finding['message'], $needle)) {
            return true;
        }
    }

    return false;
}

/**
 * Create a temporary supervisor fragment inside a module so the container
 * inspection has a real file to discover.
 */
function withModuleFragment(string $relative, Closure $callback): void
{
    $directory = base_path('Modules/HelloWorld/docker/supervisor');
    $fragment = $directory.DIRECTORY_SEPARATOR.$relative;

    if (!is_dir($directory) && !mkdir($directory, 0755, true) && !is_dir($directory)) {
        throw new RuntimeException("Could not create [{$directory}].");
    }

    file_put_contents($fragment, "[program:inspector-temp]\ncommand=sleep 1\n");

    try {
        $callback();
    } finally {
        @unlink($fragment);
        @rmdir($directory);
    }
}

afterEach(function (): void {
    config(['queue.default' => 'database', 'cache.default' => 'database']);
});

test('a module worker pool prompts the operator to restart the queue container', function (): void {
    config(['queue.default' => 'database', 'cache.default' => 'database']);

    $findings = app(ModuleContributionInspector::class)->inspect(moduleForInspection());

    expect(moduleInspectorHasFinding(
        $findings,
        ModuleContributionInspector::LEVEL_WARNING,
        'restart the queue container after install/uninstall',
    ))->toBeTrue();
});

test('verification fails when redis queues are configured without Horizon', function (): void {
    config(['queue.default' => 'redis', 'horizon' => null, 'cache.default' => 'database']);

    $reported = [];

    // A plain closure keeps the by-reference binding to $reported, which an arrow
    // function would silently copy.
    $verify = function () use (&$reported): void {
        app(ModuleContributionInspector::class)->verify(
            moduleForInspection(),
            function (string $line) use (&$reported): void {
                $reported[] = $line;
            },
        );
    };

    expect($verify)->toThrow(RuntimeException::class, 'Horizon is not installed')
        ->and($reported)->toContain('[error] QUEUE_CONNECTION=redis but Laravel Horizon is not installed. Install laravel/horizon or set QUEUE_CONNECTION=database.');
});

test('the inspector discovers the supervisor fragments a module ships', function (): void {
    config(['queue.default' => 'database', 'cache.default' => 'database']);

    withModuleFragment('inspector-temp.conf', function (): void {
        $findings = app(ModuleContributionInspector::class)->inspect(moduleForInspection());

        expect(moduleInspectorHasFinding(
            $findings,
            ModuleContributionInspector::LEVEL_INFO,
            'Supervisor fragment: docker/supervisor/inspector-temp.conf',
        ))->toBeTrue();
    });
});

test('the inspector warns about a non-shared cache store', function (): void {
    config(['queue.default' => 'database', 'cache.default' => 'array']);

    $findings = app(ModuleContributionInspector::class)->inspect(moduleForInspection());

    expect(moduleInspectorHasFinding($findings, ModuleContributionInspector::LEVEL_WARNING, 'Cache store: array.'))->toBeTrue();
});
