<?php

use OGame\Console\Commands\Module\DoctorModuleCommand;
use OGame\Console\Commands\Module\InstallModuleCommand;
use OGame\Console\Commands\Module\UninstallModuleCommand;
use Symfony\Component\Process\Process;

/**
 * The host lifecycle trial is shell, so these tests guard what it depends on: valid
 * syntax, real host artifacts and real commands. A rename that would silently rot the
 * trial fails here instead of during an operator's run.
 */
function lifecycleTrialPath(): string
{
    return base_path('scripts/e2e-module-install-trial.sh');
}

function lifecycleTrialSource(): string
{
    $source = file_get_contents(lifecycleTrialPath());

    if ($source === false) {
        throw new RuntimeException('The lifecycle trial script is unreadable.');
    }

    return $source;
}

test('the host lifecycle trial is a valid shell script', function (): void {
    expect(lifecycleTrialPath())->toBeFile();

    $process = new Process(['bash', '-n', lifecycleTrialPath()], base_path());
    $process->run();

    expect($process->getExitCode())->toBe(0)
        ->and($process->getErrorOutput())->toBe('');
});

test('the host lifecycle trial drives the real host lifecycle commands', function (string $reference): void {
    expect(lifecycleTrialSource())->toContain($reference);
})->with([
    'docker/module-hooks.sh',
    'append_module_supervisor_config',
    'queue-worker.conf',
    'module:list',
    'ogamex:module:doctor',
    'ogamex:module:install',
    'ogamex:module:uninstall',
    'config:show horizon',
    'horizon:supervisors',
]);

test('the host lifecycle trial uses the container loader the entrypoint uses', function (): void {
    expect(lifecycleTrialSource())->toContain('docker/module-hooks.sh')
        ->and(base_path('docker/module-hooks.sh'))->toBeFile();
});

test('the host lifecycle commands the trial calls are registered', function (string $command, string $class): void {
    $commands = Artisan::all();

    expect($commands)->toHaveKey($command)
        ->and(is_a($commands[$command], $class, true))->toBeTrue();
})->with([
    ['ogamex:module:install', InstallModuleCommand::class],
    ['ogamex:module:uninstall', UninstallModuleCommand::class],
    ['ogamex:module:doctor', DoctorModuleCommand::class],
]);

test('the host lifecycle trial restores the tracked status file and the module directory', function (): void {
    $source = lifecycleTrialSource();

    expect($source)->toContain('statuses_backup')
        ->and($source)->toContain("cp \"\$statuses_backup\" \"\$statuses_file\"")
        ->and($source)->toContain('module_is_moved')
        ->and($source)->toContain('trap cleanup EXIT');
});
