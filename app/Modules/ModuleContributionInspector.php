<?php

namespace OGame\Modules;

use Closure;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Redis;
use Nwidart\Modules\Module;
use RuntimeException;
use Throwable;

/**
 * Inspects the runtime and container wiring a module depends on and returns
 * actionable findings.
 *
 * Install/uninstall run this so an operator learns about a broken contribution
 * immediately (missing phpredis, unreachable Redis, missing loader, unreadable
 * fragments) instead of discovering it later when jobs never run.
 */
final class ModuleContributionInspector
{
    public const LEVEL_INFO = 'info';

    public const LEVEL_WARNING = 'warning';

    public const LEVEL_ERROR = 'error';

    /**
     * @return list<array{level: string, message: string}>
     */
    public function inspect(Module $module): array
    {
        return array_merge(
            $this->inspectRuntime(),
            $this->inspectContainer($module),
        );
    }

    /**
     * Report every finding and throw when any is an error, so install fails for a
     * genuinely broken environment (missing Horizon, missing phpredis, dead Redis)
     * but only warns for recoverable ones.
     *
     * @param  Closure(string): void  $report
     */
    public function verify(Module $module, Closure $report): void
    {
        $errors = [];

        foreach ($this->inspect($module) as $finding) {
            $report(($finding['level'] === self::LEVEL_ERROR ? '[error] ' : '').$finding['message']);

            if ($finding['level'] === self::LEVEL_ERROR) {
                $errors[] = $finding['message'];
            }
        }

        if ($errors !== []) {
            throw new RuntimeException(implode(' ', $errors));
        }
    }

    /**
     * @param  Closure(string): void  $report
     */
    public function report(Module $module, Closure $report): void
    {
        foreach ($this->inspect($module) as $finding) {
            $report($finding['message']);
        }
    }

    /**
     * @return list<array{level: string, message: string}>
     */
    private function inspectRuntime(): array
    {
        $driver = (string) config('queue.default');

        if ($driver === 'redis') {
            return array_merge(
                [$this->finding(self::LEVEL_INFO, 'Queue driver: redis. Horizon provisions the module lanes while it is enabled.')],
                $this->inspectRedis(),
                $this->inspectCache(),
            );
        }

        return array_merge([
            $this->finding(self::LEVEL_WARNING, "Queue driver: {$driver}. The module's worker pool is added to the queue container only on its next restart; restart the queue container after install/uninstall."),
        ], $this->inspectCache());
    }

    /**
     * @return list<array{level: string, message: string}>
     */
    private function inspectRedis(): array
    {
        if (!is_array(config('horizon'))) {
            return [$this->finding(self::LEVEL_ERROR, 'QUEUE_CONNECTION=redis but Laravel Horizon is not installed. Install laravel/horizon or set QUEUE_CONNECTION=database.')];
        }

        if (!extension_loaded('redis')) {
            return [$this->finding(self::LEVEL_ERROR, 'The phpredis extension is not loaded, so redis queues cannot connect. Install it (for example: pecl install redis && docker-php-ext-enable redis) and restart the containers.')];
        }

        try {
            Redis::connection()->ping();
        } catch (Throwable $exception) {
            return [
                $this->finding(self::LEVEL_INFO, 'phpredis extension: loaded.'),
                $this->finding(self::LEVEL_ERROR, "Redis connection failed: {$exception->getMessage()}"),
            ];
        }

        return [
            $this->finding(self::LEVEL_INFO, 'phpredis extension: loaded.'),
            $this->finding(self::LEVEL_INFO, 'Redis connection: reachable.'),
        ];
    }

    /**
     * @return list<array{level: string, message: string}>
     */
    private function inspectCache(): array
    {
        if (config('cache.default') === 'array') {
            return [$this->finding(self::LEVEL_WARNING, 'Cache store: array. Locks and usage budgets need a shared store (redis or database) in production.')];
        }

        return [];
    }

    /**
     * @return list<array{level: string, message: string}>
     */
    private function inspectContainer(Module $module): array
    {
        $findings = [];
        $contributes = false;

        $loader = base_path('docker/module-hooks.sh');

        if (!is_file($loader) || !is_readable($loader)) {
            $findings[] = $this->finding(self::LEVEL_WARNING, "Host module loader [{$loader}] is missing or unreadable; container and supervisor contributions will not be applied.");
        }

        foreach ($this->files($module, 'docker/supervisor', '*.conf') as $fragment) {
            $contributes = true;
            $findings[] = is_readable($fragment)
                ? $this->finding(self::LEVEL_INFO, "Supervisor fragment: {$this->relativePath($module, $fragment)}")
                : $this->finding(self::LEVEL_ERROR, "Supervisor fragment [{$fragment}] is not readable.");
        }

        foreach ($this->files($module, 'docker/entrypoint.d', '*.sh') as $hook) {
            $contributes = true;
            $findings[] = is_readable($hook)
                ? $this->finding(self::LEVEL_INFO, "Entrypoint hook: {$this->relativePath($module, $hook)}")
                : $this->finding(self::LEVEL_ERROR, "Entrypoint hook [{$hook}] is not readable.");
        }

        if (!$contributes) {
            $findings[] = $this->finding(self::LEVEL_INFO, 'Container configuration: none. This module ships no supervisor fragment and no entrypoint hook.');
        }

        return $findings;
    }

    /**
     * @return array{level: string, message: string}
     */
    private function finding(string $level, string $message): array
    {
        return ['level' => $level, 'message' => $message];
    }

    /**
     * @return list<string>
     */
    private function files(Module $module, string $directory, string $pattern): array
    {
        $path = $module->getPath().DIRECTORY_SEPARATOR.$directory;

        if (!is_dir($path)) {
            return [];
        }

        return array_values(File::glob($path.DIRECTORY_SEPARATOR.$pattern) ?: []);
    }

    private function relativePath(Module $module, string $path): string
    {
        return ltrim(str_replace($module->getPath(), '', $path), DIRECTORY_SEPARATOR);
    }
}
