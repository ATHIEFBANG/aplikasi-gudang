FROM php:8.3-apache

# 1. Install dependensi dasar, Node.js, & library PostgreSQL (libpq-dev)
RUN apt-get update && apt-get install -y \
    curl \
    zip \
    unzip \
    git \
    sqlite3 \
    libsqlite3-dev \
    libpq-dev \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs

# 2. Install ekstensi PHP (termasuk pdo_pgsql untuk PostgreSQL)
RUN docker-php-ext-install pdo pdo_pgsql pdo_sqlite

# 3. Aktifkan mod_rewrite Apache
RUN a2enmod rewrite

# 4. Arahkan Apache ke folder public Laravel
ENV APACHE_DOCUMENT_ROOT /var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

# 5. Salin semua file proyek
WORKDIR /var/www/html
COPY . .

# 6. Install paket PHP (Composer)
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer
RUN composer install --no-dev --optimize-autoloader

# 7. Install paket JS & Rakit Tampilan React
RUN npm install --legacy-peer-deps
RUN npm run build

# 8. Buat file SQLite dummy (jika masih diperlukan)
RUN touch database/database.sqlite

# 9. Atur izin folder agar tidak error permission
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache /var/www/html/database

EXPOSE 80