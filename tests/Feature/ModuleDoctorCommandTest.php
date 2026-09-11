<?php

use Illuminate\Support\Facades\Artisan;

/**
 * Run the doctor command in-process and return its exit code and full output.
 *
 * @return array{0: int, 1: string}
 */
function runModuleDoctor(string ...$arguments): array
{
    $exitCode = Artisan::call('ogamex:module:doctor', $arguments === [] ? [] : ['module' => $arguments[0]]);

    return [$exitCode, Artisan::output()];
}

afterEach(function (): void {
    config(['queue.default' => 'database', 'cache.default' => 'database']);
});

test('the doctor reports a healthy module and its container wiring', function (): void {
    config(['queue.default' => 'database', 'cache.default' => 'database']);

    [$exitCode, $output] = runModuleDoctor('AI');

    expect($exitCode)->toBe(0)
        ->and($output)->toContain('AI')
        ->and($output)->toContain('Queue driver: database')
        ->and($output)->toContain('Supervisor fragment: docker/supervisor/queue-worker.conf');
});

test('the doctor explains that a disabled module contributes nothing', function (): void {
    [$exitCode, $output] = runModuleDoctor('AI');

    expect($exitCode)->toBe(0)
        ->and($output)->toContain('disabled')
        ->and($output)->toContain('its lanes, worker pool and entrypoint hooks are inactive')
        ->and($output)->toContain('php artisan ogamex:module:install AI');
});

test('the doctor says when a module ships no container configuration at all', function (): void {
    [$exitCode, $output] = runModuleDoctor('HelloWorld');

    expect($exitCode)->toBe(0)
        ->and($output)->toContain('Container configuration: none.');
});

test('the doctor fails and explains the fix when redis queues have no Horizon', function (): void {
    config(['queue.default' => 'redis', 'horizon' => null]);

    [$exitCode, $output] = runModuleDoctor('AI');

    expect($exitCode)->toBe(1)
        ->and($output)->toContain('Horizon is not installed')
        ->and($output)->toContain('blocking problem')
        ->and($output)->toContain('Fix them');
});

test('the doctor refuses an unknown module and points at module:list', function (): void {
    [$exitCode, $output] = runModuleDoctor('NotARealModule');

    expect($exitCode)->toBe(1)
        ->and($output)->toContain('was not found')
        ->and($output)->toContain('module:list');
});
