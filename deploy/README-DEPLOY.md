# Deploying to Ubuntu + Apache

## 1. Install prerequisites

```bash
# Node.js (LTS). Using NodeSource's setup script for a recent LTS release:
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs ffmpeg apache2

# enable the modules the reverse-proxy vhost needs
sudo a2enmod proxy proxy_http headers ssl
```

## 2. Build

```bash
git clone <this repo> /opt/musicmanager-src
cd /opt/musicmanager-src
npm install
cp .env.example .env
# edit .env: set DATABASE_URL, STORAGE_ROOT, NEXTAUTH_SECRET (openssl rand -base64 32), NEXTAUTH_URL

# No migrations are committed yet (this repo has never been run against a
# real Prisma toolchain). The FIRST time you do this, anywhere, run:
#   npx prisma migrate dev --name init
# and commit the resulting prisma/migrations/ folder. Every deploy after
# that just applies existing migrations:
npx prisma migrate deploy
npm run build
```

## 3. Install

```bash
sudo useradd --system --create-home --shell /usr/sbin/nologin musicmanager
sudo mkdir -p /opt/musicmanager
# `output: "standalone"` in next.config.js produces a self-contained server
# bundle in .next/standalone, which needs the static assets and public/
# folder copied alongside it.
#
# IMPORTANT: .next/standalone/ includes a COPY of this checkout's .env,
# bundled in at build time. rsync with --exclude=.env so this initial
# copy (and every later redeploy) never clobbers the production .env
# living at /opt/musicmanager/.env with the source checkout's dev values.
sudo rsync -a --exclude='.env' .next/standalone/ /opt/musicmanager/
sudo cp -r .next/static /opt/musicmanager/.next/static
sudo cp -r public /opt/musicmanager/public
sudo mkdir -p /opt/musicmanager/storage
# Only do this ONCE, for the very first deploy - after that, .env lives
# at /opt/musicmanager/.env and should be edited there directly, never
# recopied from the source checkout.
[ -f /opt/musicmanager/.env ] || sudo cp .env /opt/musicmanager/.env
sudo chown -R musicmanager:musicmanager /opt/musicmanager
```

## 4. First-run bootstrap

```bash
cd /opt/musicmanager-src
sudo -u musicmanager npm run create-admin   # interactive, masked password prompt
```

Run this from the source checkout (it needs the Prisma client + dev
dependencies), pointed at the same `.env` / `DATABASE_URL` the deployed app
uses. It only needs to be run once, before the first admin exists.

## 5. systemd service

```bash
sudo cp deploy/musicmanager.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now musicmanager
sudo systemctl status musicmanager
```

## 6. Apache reverse proxy

```bash
sudo cp deploy/apache-musicmanager.conf /etc/apache2/sites-available/musicmanager.conf
# edit ServerName and the SSL cert paths to match your domain
sudo a2ensite musicmanager
sudo systemctl reload apache2
```

Obtain a TLS certificate first if you don't already have one (e.g. via
`certbot --apache`) - the vhost as written assumes Let's Encrypt paths.

## 7. Ongoing

- **Add a friend**: log in as an admin at `/admin/users` -> New User. There is
  no self-service sign-up anywhere in the app.
- **Updating**: `git pull && npm install && npx prisma migrate deploy && npm run build`,
  then redo step 3's copy commands (the `rsync --exclude='.env'` line, plus
  the `.next/static` and `public` copies - skip the `.env` line entirely,
  it's guarded to only run once anyway), `sudo systemctl restart musicmanager`.
- **Backups**: back up `/opt/musicmanager/storage/` (contains the SQLite
  database and every uploaded/transcoded audio file + cover image).
