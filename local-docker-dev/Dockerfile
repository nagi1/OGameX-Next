# Build from the repository root:
# docker build -f local-docker-dev/Dockerfile -t ogamex-local-docker-dev:latest .
FROM php:8.5-fpm

WORKDIR /var/www

RUN apt-get update && apt-get install -y \
    build-essential curl dos2unix git libffi-dev libfreetype6-dev libjpeg62-turbo-dev \
    libonig-dev libpng-dev libssl-dev libzip-dev mariadb-client pkg-config supervisor unzip zip \
    && docker-php-ext-install ffi pdo_mysql mbstring zip exif pcntl \
    && docker-php-ext-configure gd --with-freetype=/usr/include/ --with-jpeg=/usr/include/ \
    && docker-php-ext-install gd \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && pecl install pcov \
    && docker-php-ext-enable pcov \
    && rm -rf /tmp/pear /var/lib/apt/lists/*

RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

ENV PATH="/root/.cargo/bin:${PATH}"
RUN curl https://sh.rustup.rs -sSf | sh -s -- -y --profile minimal

COPY composer.json composer.lock /var/www/
COPY . /var/www/
COPY docker/entrypoint.sh /usr/local/bin/entrypoint
RUN dos2unix /usr/local/bin/entrypoint \
    && chmod +x /usr/local/bin/entrypoint

CMD ["/usr/local/bin/entrypoint"]
