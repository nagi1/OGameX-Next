<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/*
|--------------------------------------------------------------------------
| Test Case
|--------------------------------------------------------------------------
|
| The closure you provide to your test functions is always bound to a specific PHPUnit test
| case class. By default, that class is "PHPUnit\Framework\TestCase". Of course, you may
| need to change it using the "pest()" function to bind different classes or traits.
|
*/

pest()->extend(TestCase::class)
 // ->use(RefreshDatabase::class)
    ->in('Feature');

/*
|--------------------------------------------------------------------------
| Per-worker compiled caches
|--------------------------------------------------------------------------
|
| Parallel workers share the checkout, so they would all compile services,
| packages and the module manifest into the same files while other workers boot
| from them. That race decides whether an enabled module's providers are
| registered in a given test, which shows up as a rare failure in an unrelated
| file. TEST_TOKEN is ParaTest's worker token, and it is present before any
| application boots, so each worker gets its own cache path here.
|
| The module manifest is derived from the services cache path, so overriding
| APP_SERVICES_CACHE isolates it too.
|
*/
$parallelToken = $_SERVER['TEST_TOKEN'] ?? $_ENV['TEST_TOKEN'] ?? null;

if (is_string($parallelToken) && $parallelToken !== '') {
    $parallelCachePath = __DIR__.'/../bootstrap/cache/parallel/'.$parallelToken;

    if (!is_dir($parallelCachePath) && !@mkdir($parallelCachePath, 0777, true) && !is_dir($parallelCachePath)) {
        throw new RuntimeException("Could not create the worker cache directory [{$parallelCachePath}].");
    }

    foreach (['APP_SERVICES_CACHE' => 'services.php', 'APP_PACKAGES_CACHE' => 'packages.php'] as $key => $file) {
        $path = $parallelCachePath.'/'.$file;
        putenv("{$key}={$path}");
        $_ENV[$key] = $path;
        $_SERVER[$key] = $path;
    }
}
