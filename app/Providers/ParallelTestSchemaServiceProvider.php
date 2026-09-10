<?php

namespace OGame\Providers;

use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\ParallelTesting;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\ServiceProvider;
use RuntimeException;
use Throwable;

/**
 * Reuses a migrated MySQL template for parallel test workers.
 *
 * The template is rebuilt only when a migration changes. Each worker receives a database
 * cloned directly by MySQL, including migration-created baseline data such as roles.
 * No schema dump files or external database client binaries are involved.
 */
class ParallelTestSchemaServiceProvider extends ServiceProvider
{
    private const META_TABLE = 'parallel_test_schema_meta';

    private const TEMPLATE_FORMAT_VERSION = '7';

    public function boot(): void
    {
        if (!$this->app->runningInConsole() || !isset($_ENV['LARAVEL_PARALLEL_TESTING'])) {
            return;
        }

        // Pest sets this in $_ENV, while Laravel checks $_SERVER to decide whether to run
        // the parallel testing lifecycle callbacks.
        $_SERVER['LARAVEL_PARALLEL_TESTING'] = $_ENV['LARAVEL_PARALLEL_TESTING'];

        $connection = config('database.default');
        $databaseKey = "database.connections.{$connection}.database";
        $database = config($databaseKey);

        if ($database === ':memory:' || config("database.connections.{$connection}.driver") !== 'mysql') {
            return;
        }

        ParallelTesting::setUpProcess(function (int $token) use ($connection, $databaseKey, $database): void {
            $this->prepareWorkerDatabase($connection, $databaseKey, $database, $token);
        });
    }

    private function prepareWorkerDatabase(string $connection, string $databaseKey, string $database, int $token): void
    {
        $version = $this->migrationVersion();
        $template = "{$database}_parallel_template";
        $worker = "{$database}_test_{$token}";

        $this->ensureTemplate($connection, $databaseKey, $database, $template, $version);

        if ($this->hasVersion($worker, $version)) {
            return;
        }

        $lockConnection = 'parallel-test-worker-lock';
        config()->set("database.connections.{$lockConnection}", config("database.connections.{$connection}"));
        $lockDatabase = DB::connection($lockConnection);
        $acquired = $lockDatabase->selectOne('SELECT GET_LOCK(?, 120) AS acquired', ["ogamex-parallel-worker:{$worker}"]);

        if ((int) array_values((array) $acquired)[0] !== 1) {
            throw new RuntimeException("Could not acquire the parallel test worker lock for {$worker}.");
        }

        try {
            if ($this->hasVersion($worker, $version)) {
                return;
            }

            Schema::dropDatabaseIfExists($worker);
            Schema::createDatabase($worker);

            try {
                $this->cloneDatabase($template, $worker);
            } catch (Throwable $exception) {
                Schema::dropDatabaseIfExists($worker);

                throw $exception;
            }
        } finally {
            $lockDatabase->select('SELECT RELEASE_LOCK(?)', ["ogamex-parallel-worker:{$worker}"]);
            DB::disconnect($lockConnection);
        }
    }

    private function ensureTemplate(string $connection, string $databaseKey, string $database, string $template, string $version): void
    {
        if ($this->hasVersion($template, $version)) {
            return;
        }

        $lock = "ogamex-parallel-template:{$database}";
        $lockConnection = 'parallel-test-schema-lock';
        config()->set("database.connections.{$lockConnection}", config("database.connections.{$connection}"));
        $lockDatabase = DB::connection($lockConnection);
        $acquired = $lockDatabase->selectOne('SELECT GET_LOCK(?, 120) AS acquired', [$lock]);

        if ((int) array_values((array) $acquired)[0] !== 1) {
            throw new RuntimeException('Could not acquire the parallel test schema lock.');
        }

        try {
            if ($this->hasVersion($template, $version)) {
                return;
            }

            Schema::dropDatabaseIfExists($template);
            Schema::createDatabase($template);

            config()->set($databaseKey, $template);
            DB::purge($connection);

            Artisan::call('migrate', ['--database' => $connection, '--force' => true]);
            DB::statement('CREATE TABLE '.self::META_TABLE.' (version CHAR(64) NOT NULL PRIMARY KEY)');
            DB::table(self::META_TABLE)->insert(['version' => $version]);
        } finally {
            config()->set($databaseKey, $database);
            DB::purge($connection);
            $lockDatabase->select('SELECT RELEASE_LOCK(?)', [$lock]);
            DB::disconnect($lockConnection);
        }
    }

    private function cloneDatabase(string $source, string $target): void
    {
        $sourceName = $this->quoteIdentifier($source);
        $targetName = $this->quoteIdentifier($target);
        $tableNames = collect(DB::select("SHOW FULL TABLES FROM {$sourceName} WHERE Table_type = 'BASE TABLE'"))
            ->map(fn (object $table): string => array_values((array) $table)[0])
            ->reject(fn (string $table): bool => $table === self::META_TABLE)
            ->all();

        $definitions = [];

        foreach ($tableNames as $name) {
            $definition = array_values((array) DB::selectOne(
                "SHOW CREATE TABLE {$sourceName}.".$this->quoteIdentifier($name)
            ))[1];

            if (!is_string($definition)) {
                throw new RuntimeException("Could not read the table definition for {$name}.");
            }

            $definitions[$name] = $definition;
        }

        $foreignKeys = [];

        foreach ($definitions as $name => $definition) {
            $tableName = $this->quoteIdentifier($name);
            $definition = preg_replace(
                '/^CREATE TABLE `'.preg_quote($name, '/').'`/i',
                "CREATE TABLE {$targetName}.{$tableName}",
                $definition,
                1
            );

            if (!is_string($definition)) {
                throw new RuntimeException("Could not transform the table definition for {$name}.");
            }

            $definition = preg_replace_callback(
                '/,\n  (CONSTRAINT `[^`]+` FOREIGN KEY .*?)(?=(?:,\n  CONSTRAINT |\n\) ENGINE))/s',
                function (array $matches) use (&$foreignKeys, $name, $targetName): string {
                    $foreignKeys[] = [
                        'table' => $name,
                        'definition' => preg_replace_callback(
                            '/REFERENCES `([^`]+)`/',
                            fn (array $reference): string => "REFERENCES {$targetName}.".$this->quoteIdentifier($reference[1]),
                            $matches[1]
                        ),
                    ];

                    return '';
                },
                $definition
            );

            if (!is_string($definition)) {
                throw new RuntimeException("Could not transform the table definition for {$name}.");
            }

            DB::statement($definition);
        }

        foreach ($foreignKeys as $foreignKey) {
            DB::statement(
                "ALTER TABLE {$targetName}.".$this->quoteIdentifier($foreignKey['table']).' ADD '.$foreignKey['definition']
            );
        }

        DB::statement('SET FOREIGN_KEY_CHECKS = 0');

        try {
            foreach ($tableNames as $name) {
                $tableName = $this->quoteIdentifier($name);

                DB::statement("INSERT INTO {$targetName}.{$tableName} SELECT * FROM {$sourceName}.{$tableName}");
            }

            $metaTable = $this->quoteIdentifier(self::META_TABLE);
            DB::statement("CREATE TABLE {$targetName}.{$metaTable} LIKE {$sourceName}.{$metaTable}");
            DB::statement("INSERT INTO {$targetName}.{$metaTable} SELECT * FROM {$sourceName}.{$metaTable}");
        } finally {
            DB::statement('SET FOREIGN_KEY_CHECKS = 1');
        }
    }

    /**
     * @phpstan-impure
     */
    private function hasVersion(string $database, string $version): bool
    {
        try {
            $result = DB::selectOne(
                'SELECT version FROM '.$this->quoteIdentifier($database).'.'.self::META_TABLE.' WHERE version = ? LIMIT 1',
                [$version]
            );

            return $result !== null;
        } catch (Throwable) {
            return false;
        }
    }

    private function migrationVersion(): string
    {
        $migrations = File::allFiles(database_path('migrations'));
        $contents = [];

        foreach ($migrations as $migration) {
            $contents[$migration->getRelativePathname()] = hash_file('sha256', $migration->getPathname());
        }

        ksort($contents);

        return hash('sha256', self::TEMPLATE_FORMAT_VERSION.serialize($contents));
    }

    private function quoteIdentifier(string $identifier): string
    {
        return '`'.str_replace('`', '``', $identifier).'`';
    }
}
