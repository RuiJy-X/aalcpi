# NativePHP Auto-Updates

Installed desktop builds can receive updates automatically when you publish with:

```bash
php artisan native:publish
```

This project is configured to use **GitHub Releases** as the update feed.

## How it works

1. You bump `NATIVEPHP_APP_VERSION` in `.env`.
2. You run `php artisan native:publish` (optionally `win`, `mac`, or `linux`).
3. NativePHP builds the app and uploads artifacts to GitHub Releases for that version tag (`vX.Y.Z`).
4. Installed production apps poll GitHub for a newer version, download it, and install on restart.

Auto-update only runs in **production packaged builds**, not `php artisan native:run` / `native:dev`.

## Required `.env` settings

```env
NATIVEPHP_APP_VERSION=1.1.3
NATIVEPHP_APP_ID=com.aalcpi.app

NATIVEPHP_UPDATER_ENABLED=true
NATIVEPHP_UPDATER_PROVIDER=github

GITHUB_OWNER=RuiJy-X
GITHUB_REPO=aalcpi
GITHUB_TOKEN=ghp_xxxxxxxx          # repo scope: create/update releases + upload assets
GITHUB_V_PREFIXED_TAG_NAME=true
GITHUB_PRIVATE=false
GITHUB_CHANNEL=latest
GITHUB_RELEASE_TYPE=release       # use "draft" if you want to review before going public
```

### Token notes

- `GITHUB_TOKEN` is used **on your build machine** by `native:publish` to upload release assets.
- It is stripped from the packaged app via `cleanup_env_keys` (see `config/nativephp.php`).
- For a **public** repo, installed apps do not need a token to check for updates.
- For a **private** repo, set `GITHUB_PRIVATE=true` and provide a read-only `GITHUB_AUTOUPDATE_TOKEN` for clients.

## Publish checklist (each release)

1. **Commit and push** your code changes.
2. **Bump the version** (must increase every release):

   ```env
   NATIVEPHP_APP_VERSION=1.1.3
   ```

3. **Create a GitHub Release draft/tag** for `v1.1.3` (matching the version with a `v` prefix) if GitHub does not create it automatically for your setup.
4. **Publish the build** from the machine that matches (or can cross-build) your target OS:

   ```bash
   # current OS/arch
   php artisan native:publish

   # or target explicitly
   php artisan native:publish win
   php artisan native:publish mac
   php artisan native:publish linux
   ```

5. On GitHub → **Releases**, confirm the version has the installer / update files attached.
6. If `GITHUB_RELEASE_TYPE=draft`, **Publish the release** so installed apps can see it.
7. On an installed older build, restart the app. It should detect the new version, download it, and install on the next restart.

## App identity

`NATIVEPHP_APP_ID` must stay the same across releases (e.g. `com.aalcpi.app`). Changing it makes the OS treat the build as a different app, so updates will not apply cleanly.

## Runtime behavior in this project

- Electron starts auto-update checks when `nativephp.updater.enabled` is true.
- `NativeAppServiceProvider` also calls `AutoUpdater::checkForUpdates()` once the Laravel app boots in production.
- When a download finishes, a desktop notification tells the user to restart.
- Updates apply automatically on the next app start (or via `AutoUpdater::quitAndInstall()` if you wire a button later).

## Troubleshooting

| Issue | What to check |
|-------|----------------|
| No update offered | Version was not bumped, or GitHub release is still a draft |
| Publish fails auth | `GITHUB_TOKEN` permissions / expired token |
| Wrong app updated | `NATIVEPHP_APP_ID` changed between releases |
| Works on one OS only | Publish artifacts for each target OS users install |
| Dev mode never updates | Expected — updater is for packaged production builds |

## Optional: force a check from PHP

```php
use Native\Desktop\Facades\AutoUpdater;

AutoUpdater::checkForUpdates();
// After download:
// AutoUpdater::quitAndInstall();
```
