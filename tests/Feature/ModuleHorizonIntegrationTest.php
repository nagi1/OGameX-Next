<?php

use Symfony\Component\Process\Process;

/**
 * Run an artisan command in a fresh process with an isolated module status file,
 * so the enabled/disabled result matches what an operator sees.
 *
 * @param  list<string>  $arguments
 * @param  array<string, string>  $environment
 * @return array{0: int, 1: string}
 */
function runOgamexConfigArtisan(array $arguments, array $environment): array
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
function isolatedHorizonStatuses(array $statuses): string
{
    $path = sys_get_temp_dir().'/horizon_statuses_'.uniqid('', true).'.json';
    file_put_contents($path, json_encode($statuses));

    return $path;
}

test('the enabled AI module registers its redis horizon lanes in every environment', function (): void {
    $statuses = isolatedHorizonStatuses(['AI' => true]);

    foreach (['production', 'staging', 'local', 'qa'] as $environment) {
        [$exitCode, $output] = runOgamexConfigArtisan(
            ['config:show', 'horizon'],
            ['MODULES_STATUSES_FILE' => $statuses, 'APP_ENV' => $environment],
        );

        expect($exitCode)->toBe(0)
            ->and($output)->toContain('supervisor-ai')
            ->and($output)->toContain('supervisor-ai-language')
            ->and($output)->toContain('ai-language')
            ->and($output)->toContain('redis');
    }

    @unlink($statuses);
});

test('the disabled AI module leaves no horizon trace', function (): void {
    $statuses = isolatedHorizonStatuses(['AI' => false]);

    [$exitCode, $output] = runOgamexConfigArtisan(
        ['config:show', 'horizon'],
        ['MODULES_STATUSES_FILE' => $statuses, 'APP_ENV' => 'production'],
    );

    expect($exitCode)->toBe(0)
        ->and($output)->not->toContain('supervisor-ai')
        ->and($output)->not->toContain('ai-language');

    @unlink($statuses);
});

test('the AI module announces its queue names only while enabled', function (): void {
    $enabled = isolatedHorizonStatuses(['AI' => true]);
    $disabled = isolatedHorizonStatuses(['AI' => false]);

    [, $enabledQueue] = runOgamexConfigArtisan(['config:show', 'queue'], ['MODULES_STATUSES_FILE' => $enabled]);
    [, $disabledQueue] = runOgamexConfigArtisan(['config:show', 'queue'], ['MODULES_STATUSES_FILE' => $disabled]);

    expect($enabledQueue)->toContain('module_queue_names')
        ->and($enabledQueue)->toContain('ai-language')
        ->and($disabledQueue)->not->toContain('module_queue_names');

    @unlink($enabled);
    @unlink($disabled);
});
