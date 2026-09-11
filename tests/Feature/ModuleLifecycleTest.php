<?php

use Symfony\Component\Process\Process;

/**
 * Run an artisan command in a fresh process, exactly as an operator would, with an
 * isolated module statuses file. This also sidesteps the in-process Env/activator
 * caching that can hide what `module:enable` really wrote.
 *
 * @param  list<string>  $arguments
 * @param  array<string, string>  $environment
 * @return array{0: int, 1: string}
 */
function runOgamexModuleArtisan(array $arguments, array $environment): array
{
    $process = new Process(
        array_merge([PHP_BINARY, base_path('artisan')], $arguments),
        base_path(),
        $environment,
    );
    $process->run();

    return [$process->getExitCode() ?? 1, $process->getOutput().$process->getErrorOutput()];
}

/**
 * @param  array<string, bool>  $statuses
 */
function isolatedModuleStatuses(array $statuses): string
{
    $path = sys_get_temp_dir().'/modules_statuses_'.uniqid('', true).'.json';
    file_put_contents($path, json_encode($statuses, JSON_PRETTY_PRINT));

    return $path;
}

function isolatedModuleEnabled(string $path, string $name): bool
{
    if (!is_file($path)) {
        return false;
    }

    return (bool) ((json_decode((string) file_get_contents($path), true)[$name] ?? false));
}

test('install enables the module and runs its hook', function (): void {
    $statuses = isolatedModuleStatuses(['HelloWorld' => false]);

    [$exitCode, $output] = runOgamexModuleArtisan(
        ['ogamex:module:install', 'HelloWorld'],
        ['MODULES_STATUSES_FILE' => $statuses],
    );

    expect($exitCode)->toBe(0)
        ->and($output)->toContain('HelloWorld install hook completed.')
        ->and(isolatedModuleEnabled($statuses, 'HelloWorld'))->toBeTrue();

    @unlink($statuses);
});

test('dry run reports the plan without changing anything', function (): void {
    $statuses = isolatedModuleStatuses(['HelloWorld' => false]);

    [$exitCode, $output] = runOgamexModuleArtisan(
        ['ogamex:module:install', 'HelloWorld', '--dry-run'],
        ['MODULES_STATUSES_FILE' => $statuses],
    );

    expect($exitCode)->toBe(0)
        ->and($output)->toContain('Would install module [HelloWorld]')
        ->and($output)->toContain('Run the module install hook')
        ->and(isolatedModuleEnabled($statuses, 'HelloWorld'))->toBeFalse();

    @unlink($statuses);
});

test('uninstall disables the module, runs its hook and keeps data by default', function (): void {
    $statuses = isolatedModuleStatuses(['HelloWorld' => true]);

    [$exitCode, $output] = runOgamexModuleArtisan(
        ['ogamex:module:uninstall', 'HelloWorld'],
        ['MODULES_STATUSES_FILE' => $statuses],
    );

    expect($exitCode)->toBe(0)
        ->and($output)->toContain('HelloWorld uninstall hook completed.')
        ->and($output)->not->toContain('Roll back every module migration')
        ->and(isolatedModuleEnabled($statuses, 'HelloWorld'))->toBeFalse();

    @unlink($statuses);
});

test('uninstall drop-data lists the rollback only when requested and migrations exist', function (): void {
    // HelloWorld ships no migrations, so drop-data has nothing to roll back.
    $noMigrations = isolatedModuleStatuses(['HelloWorld' => true]);

    [, $helloDrop] = runOgamexModuleArtisan(
        ['ogamex:module:uninstall', 'HelloWorld', '--drop-data', '--dry-run'],
        ['MODULES_STATUSES_FILE' => $noMigrations],
    );

    // AI ships migrations, so the rollback appears only with --drop-data.
    $withMigrations = isolatedModuleStatuses(['AI' => true]);

    [, $withoutDrop] = runOgamexModuleArtisan(
        ['ogamex:module:uninstall', 'AI', '--dry-run'],
        ['MODULES_STATUSES_FILE' => $withMigrations],
    );

    [, $withDrop] = runOgamexModuleArtisan(
        ['ogamex:module:uninstall', 'AI', '--drop-data', '--dry-run'],
        ['MODULES_STATUSES_FILE' => $withMigrations],
    );

    expect($helloDrop)->not->toContain('Roll back every module migration')
        ->and($withoutDrop)->not->toContain('Roll back every module migration')
        ->and($withDrop)->toContain('Roll back every module migration');

    @unlink($noMigrations);
    @unlink($withMigrations);
});

test('drop-data without force aborts and keeps the module enabled', function (): void {
    $statuses = isolatedModuleStatuses(['HelloWorld' => true]);

    [$exitCode, $output] = runOgamexModuleArtisan(
        ['ogamex:module:uninstall', 'HelloWorld', '--drop-data'],
        ['MODULES_STATUSES_FILE' => $statuses],
    );

    expect($exitCode)->not->toBe(0)
        ->and($output)->toContain('Aborted. Module data was not dropped.')
        ->and(isolatedModuleEnabled($statuses, 'HelloWorld'))->toBeTrue();

    @unlink($statuses);
});

test('an unknown module fails with a helpful message', function (): void {
    $statuses = isolatedModuleStatuses(['HelloWorld' => false]);

    [$exitCode, $output] = runOgamexModuleArtisan(
        ['ogamex:module:install', 'DoesNotExist'],
        ['MODULES_STATUSES_FILE' => $statuses],
    );

    expect($exitCode)->not->toBe(0)
        ->and($output)->toContain('was not found')
        ->and($output)->toContain('module:list');

    @unlink($statuses);
});
