# Deployed Worker setup

The `nyducati` Worker is connected to `forscery/NYDUCATI` on branch `main`. Build: `npm run build`; deployment: `npx wrangler deploy`; Node 22.22 or newer.

Runtime configuration:

- `GITHUB_CLIENT_ID` and secret `GITHUB_CLIENT_SECRET` for the existing GitHub OAuth app.
- R2 bucket `nyducati-media` bound as `MEDIA`, declared in `wrangler.jsonc`.
- OAuth callback: `https://nyducati.hidden-silence-47e4.workers.dev/auth/callback`.

The R2 bucket stays private. Worker `/media/` routes serve individual images publicly. `/api/media` requires the editor's authenticated GitHub account to have repository write access. No new API key is required.

After deployment, open `/admin/`, create an unpublished test post, insert/upload one image, confirm it appears inline and in the styled preview, switch Visual/Markdown modes, save and reopen. Test publishing only when ready. Uploaded media is public even if its article is still a draft.

Production domain/DNS changes and full archive migration are separate later steps.
