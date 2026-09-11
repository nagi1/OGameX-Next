#!/bin/sh

role=${CONTAINER_ROLE:-none}

if [ ! -f /var/www/.env ]; then
    if [ -f /var/www/.env.example ]; then
        cp /var/www/.env.example /var/www/.env
        echo ".env file not found, copied .env.example to .env"
    else
        echo "Error: .env and .env.example files not found. Please create an .env file." >&2
        exit 1
    fi
fi

# Extract environment information
is_production=false
if grep -q "^APP_ENV=production" .env; then
    is_production=true
fi

# Configure Git to trust the working directory
git config --global --add safe.directory /var/www

# Load module-provided container configuration (supervisor fragments and entrypoint
# hooks). Only enabled modules contribute; see docker/module-hooks.sh. A missing or
# unreadable loader simply means no module contributions.
if [ -r /var/www/docker/module-hooks.sh ]; then
    . /var/www/docker/module-hooks.sh
    run_module_entrypoint_hooks "$role"
fi

if [ "$role" = "scheduler" ]; then
    while true; do
        php /var/www/artisan schedule:run --verbose --no-interaction
        sleep 60
    done
elif [ "$role" = "queue" ]; then
      # One queue container, two possible backends, chosen from the configured queue
      # driver so operators only ever manage a single queue service:
      #
      #   QUEUE_CONNECTION=redis  -> Laravel Horizon, which provisions its worker pools
      #                              from config/horizon.php (queue names, timeouts and
      #                              memory limits). Horizon only supports Redis.
      #   anything else           -> the database worker pools below: a light lane for
      #                              logistics and a heavy lane for battle-capable missions.
      #
      # The container environment wins over .env (Laravel's env repository is immutable),
      # so both sources are checked.
      queue_connection="${QUEUE_CONNECTION:-}"
      if [ -z "$queue_connection" ]; then
          queue_connection=$(grep -E "^QUEUE_CONNECTION=" .env | head -n1 | cut -d '=' -f2 | tr -d '[:space:]')
      fi

      if [ "$queue_connection" = "redis" ]; then
          echo "QUEUE_CONNECTION=redis detected, starting Laravel Horizon under supervisor..."
          exec supervisord -c /var/www/docker/supervisor/horizon.conf
      fi

      # Run two worker pools under supervisor so independent planet destinations are
      # processed in parallel. The light pool is dedicated to light traffic (transports,
      # deployments, returns) so it is never blocked by battles; the heavy pool handles
      # battles and backfills light work when idle. Tune via QUEUE_WORKERS_LIGHT /
      # QUEUE_WORKERS_HEAVY. The worker flags live in docker/supervisor/queue-worker.conf.
      workers_light=${QUEUE_WORKERS_LIGHT:-2}
      workers_heavy=${QUEUE_WORKERS_HEAVY:-3}
      echo "Starting ${workers_light} light + ${workers_heavy} heavy fleet-arrival worker(s) under supervisor..."
      sed -e "s/{{QUEUE_WORKERS_LIGHT}}/${workers_light}/g" \
          -e "s/{{QUEUE_WORKERS_HEAVY}}/${workers_heavy}/g" \
          /var/www/docker/supervisor/queue-worker.conf > /tmp/queue-worker.conf

      # Let enabled modules add their own supervisor pools, so a module can own its
      # workers without a host edit and a disabled module leaves none behind.
      if command -v append_module_supervisor_config >/dev/null 2>&1; then
          append_module_supervisor_config /tmp/queue-worker.conf
      fi

      exec supervisord -c /tmp/queue-worker.conf
elif [ "$role" = "reverb" ]; then
    php /var/www/artisan reverb:start --host="${REVERB_SERVER_HOST:-0.0.0.0}" --port="${REVERB_SERVER_PORT:-8090}"
elif [ "$role" = "app" ]; then
    # Check APP_ENV and run appropriate composer install
    if [ "$is_production" = true ]; then
        echo "Production environment detected. Running composer install --no-dev..."
        composer install --no-dev
    else
        echo "Development environment detected. Running composer install..."
        composer install
    fi

    # Generate APP_KEY if not set or empty in the .env file
    app_key=$(grep -E "^APP_KEY=" .env | cut -d '=' -f2 | tr -d '[:space:]' | tr -d '\r')
    if [ -z "$app_key" ]; then
        echo "APP_KEY is empty or not set. Generating a new key..."
        php artisan key:generate --force
    else
        echo "APP_KEY is set to: $app_key"
    fi

    # Compile rust modules
    chmod +x ./rust/compile.sh
    ./rust/compile.sh

    # Ensure storage directory has correct ownership for www-data
    chown -R www-data:www-data /var/www/storage

    # Run migrations as www-data to ensure log files are created with correct ownership
    su -s /bin/sh -c "php artisan migrate --force" www-data

    # Only run caching in production (as www-data to ensure correct file ownership)
    if [ "$is_production" = true ]; then
        echo "Production environment: Caching configurations..."
        su -s /bin/sh -c "php artisan cache:clear && php artisan config:cache && php artisan route:cache && php artisan view:cache" www-data
    fi

    exec php-fpm
else
    echo "Could not match the container role \"$role\""
    exit 1
fi
