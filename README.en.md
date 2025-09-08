# Goshuin Logbook

A web application to record and manage goshuin (temple/shrine stamps) collected across Japan.

![App screenshot](public/images/screenshot.png)

## Key features

- Temple/shrine management:
  - List temples/shrines
  - Register a new site (name, type, prefecture, address, coordinates, description)
  - View site details

- Goshuin records:
  - Upload an image, store visit date and notes
  - List records per site

- Search & view:
  - Plot registered sites on a map
  - List sites by prefecture

## Tech stack

- Backend: Node.js, Express
- Templates: EJS
- Database: SQLite3
- Query builder: Knex.js
- File uploads: Multer

## Setup and run

1. Clone the repository:

```bash
git clone https://github.com/s-nasu/otomail.git
cd otomail
```

2. Install dependencies:

```bash
npm install
```

3. Setup the database (create tables and seed prefectures):

```bash
# Run migrations
npx knex migrate:latest

# Run seeds
npx knex seed:run
```

This will create `db/goshuin.sqlite3` in the `db/` directory.

4. Start the app:

```bash
node index.js
```

5. Open http://localhost:3000 in your browser.

## Database schema

There are three main tables: `prefectures`, `sites`, and `goshuin_records`.

ER (simplified):

```
[prefectures] 1--*< [sites] 1--*< [goshuin_records]
```

See the Japanese README for column details.

## Generated types workflow

This repository automatically generates TypeScript types from the SQLite schema. Generated types are written to `types/generated-db.ts`. The project treats `types/db.ts` as the source of truth derived from the generated file.

Basic flow:

- Generate: run `npm run gen:types` to update `types/generated-db.ts`.
- Check: run `node scripts/check-generated-types.cjs` locally to compare `types/generated-db.ts` with `types/db.ts`. The script exits non-zero when they differ.
- Merge (manual): to apply generated changes to `types/db.ts` locally, run `node scripts/merge-db-types-ast.cjs` (the script creates a backup before overwriting).

CI auto PR:

- A GitHub Actions workflow runs `gen:types` and, if differences are found, automatically creates a PR that updates `types/db.ts`. The workflow file is `.github/workflows/update-generated-types-pr.yml`.

Recommended policy:

- Do not edit the generated file directly. Make schema changes via Knex migrations, run `npm run gen:types`, review the diff, and then commit the updated `types/db.ts` (or merge the auto PR).

## Deployment and PM2 (operations)

If you want to run the Node app as a long-running service in production, here is a short example using PM2. These steps are intended as a simple deployment checklist.

1. Install PM2 (recommended globally on the server):

```bash
# Recommended: install globally
npm install -g pm2

# Or use project-local pm2 via npm scripts
npm install
```

2. Build and start with PM2:

```bash
npm run build
npm run start:pm2
```

3. Enable pm2-logrotate (rotate logs automatically):

```bash
# Install the module
npm run pm2:install-logrotate

# Configure: e.g. max size 10M, keep 7 files, enable compression
npm run pm2:configure-logrotate
```

4. Make PM2 start on boot:

```bash
# Run once (may require sudo)
pm2 startup

# Save current process list
pm2 save
```

5. Logs, stop, restart:

```bash
npm run pm2:logs
npm run stop:pm2
npm run restart:pm2
```

Notes:
- We set `out_file`/`error_file` in `ecosystem.config.js` to write logs into `./logs/`. The `logs/` directory exists in the repo.
- For production, prefer a globally-installed `pm2` and run `pm2 startup` + `pm2 save` to persist the process across reboots.
- You may also prefer OS-level logrotate instead of the `pm2-logrotate` module depending on your environment.

## Replacing the screenshot

The current screenshot is stored at `public/images/screenshot.png`. To replace it, copy your new image to that path and commit it:

```bash
cp /path/to/new_screenshot.png public/images/screenshot.png
git add public/images/screenshot.png
git commit -m "Update screenshot"
git push
```

Recommended image size: ~1200x800, use compressed PNG/JPEG to keep the repo small.

## Deployment cautions

When deploying to production, consider the following:

- Environment variables: set `PORT`, `NODE_ENV`, and any DB file path appropriately. Using `ecosystem.config.js`'s `env` block helps.
- SQLite location and backups: if you use `db/goshuin.sqlite3`, ensure write permissions and create automated backups (cron + `sqlite3 .backup` or file copy).
- Upload directory permissions: ensure `public/uploads/` is writable by the pm2 user/process.
- Reverse proxy & TLS: front the app with `nginx`/`traefik` and terminate TLS at the proxy. Configure redirects and caching at the proxy level.
- Security: validate uploaded files (type, size), sanitize filenames, and add authentication if needed.
- Monitoring: consider host-level monitoring or APM (systemd, Datadog, Prometheus, etc.) in addition to pm2.

## Systemd unit and Makefile (server deploy)

This repository includes a systemd unit template and a simple Makefile to help with server deployment.

- `contrib/goshuin-app.service` — a systemd unit file template. Update `User`, `WorkingDirectory`, and `ExecStart` to fit your environment before installing.
- `Makefile` — provides convenient targets:
  - `make build` — runs project build
  - `make backup-db` — creates a timestamped copy of `db/goshuin.sqlite3` into `backups/`
  - `make deploy` — runs `build`, `backup-db`, then `./scripts/deploy.sh`
  - `make install-service` — copies the unit file to `/etc/systemd/system/` (requires sudo)
  - `make enable-service` — installs and enables the systemd service (runs `install-service` then enables)
  - `make restart` — restarts the systemd service
  - `make logs` — tails the journal for the service

Example server install steps:

```bash
# copy repository to server and install dependencies
npm install --production

# build, backup and deploy
make deploy

# install and enable the systemd service (edit the unit file first!)
make install-service
sudo systemctl enable --now goshuin-app.service

# check logs
make logs
```

Note: service installation and enabling require root privileges. Edit `contrib/goshuin-app.service` and set the correct paths before running `make install-service`.

## Future work

- Add more tests
- Add edit/delete for goshuin records
- Add site edit functionality
- Add user authentication
- Add full-text search
