# Deploying to Ubuntu + Apache

## 1. Install prerequisites

```bash
# Swift toolchain (see https://www.swift.org/install/linux/ for the current
# recommended install method/version for your Ubuntu release)
sudo apt-get update
sudo apt-get install -y ffmpeg apache2

# enable the modules the reverse-proxy vhost needs
sudo a2enmod proxy proxy_http headers ssl
```

## 2. Build

```bash
git clone <this repo> /opt/musicmanager-src
cd /opt/musicmanager-src
swift build -c release
```

## 3. Install

```bash
sudo useradd --system --create-home --shell /usr/sbin/nologin musicmanager
sudo mkdir -p /opt/musicmanager
sudo cp .build/release/App /opt/musicmanager/
sudo cp -r Public Resources /opt/musicmanager/
sudo mkdir -p /opt/musicmanager/storage
sudo chown -R musicmanager:musicmanager /opt/musicmanager
```

## 4. First-run bootstrap

```bash
cd /opt/musicmanager
sudo -u musicmanager ./App migrate --yes
sudo -u musicmanager ./App admin-create   # interactive, masked password prompt
```

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
`certbot --apache`) — the vhost as written assumes Let's Encrypt paths.

## 7. Ongoing

- **Add a friend**: log in as an admin at `/admin/users` → New User. There is
  no self-service sign-up anywhere in the app.
- **Updating**: `git pull && swift build -c release`, copy the new binary
  over `/opt/musicmanager/App`, `sudo systemctl restart musicmanager`.
- **Backups**: back up `/opt/musicmanager/storage/` (contains the SQLite
  database and every uploaded/transcoded audio file + cover image).
