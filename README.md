# NYDUCATI preview and Decap CMS

Astro static site with the five Italian Lakes chapters and three original navigation pages. Original URLs, article HTML, search, full-screen photo banners and adaptive black/white logo are retained. Blogger and the existing private Sites preview are unchanged.

## Editor

`/admin/` loads Decap CMS. GitHub backend is configured for `forscery/NYDUCATI`, branch `main`, with editorial drafts/review/publish. Authentication still requires the hosting/OAuth setup below; it has not been verified end-to-end.

Stories live in `content/posts/*.json`. Imported stories retain HTML exactly; edit these in the editor's Source mode to preserve layout. New stories use the visual Markdown editor. Each story has a URL, excerpt, photographs, and optional hero with black/white title and logo controls. New stories use display order 100 or higher and appear on the homepage and in full-text search when published. Imported order values 0–7 identify the original collection/chapter positions: preserve those values. `content.json` is a migration reference, not the active content store.

Site settings controls modular navigation, homepage and journey banners. The Italian Lakes overview remains a five-chapter template; a general multi-trip collection editor is future work.

## Build

Use Node 22.22 or newer. `npm ci`, `npm run build`, `npm test`. Build copies the pinned CMS bundle and lazy-loaded chunks to `/admin/vendor/`; ordinary readers do not load the CMS. Output is `dist/`.

## Hosting and sign-in (not yet activated)

1. Import this repository into Netlify, branch `main`. The build/publish settings are in `netlify.toml`.
2. Register a GitHub OAuth application with the deployed site as homepage and `https://api.netlify.com/auth/done` as callback.
3. In Netlify's OAuth provider settings, install the GitHub client ID and secret. Never commit the secret or paste it into chat.
4. Open `/admin/`, sign in with a GitHub user who can push to this repository, save a draft, publish, and verify the resulting build before using the editor regularly.

References: https://decapcms.org/docs/github-backend/ and https://docs.netlify.com/manage/security/secure-access-to-sites/oauth-provider-tokens/

No hosting account has been linked. No subscription or DNS change has been made. Choose and verify deployment audience/access before publishing. All pages and hosting headers currently use noindex/nofollow, which is not access control. Production launch must deliberately remove those directives after SEO checks.

## Remaining migration work

Only eight sample pages are imported. Google Photos originals have not been downloaded or transcoded. Eight covers are local; inline photographs still reference Blogger/Google. Full archive migration, original-media processing, and production SEO checks remain outstanding. The logo uses supplied artwork; a licensed Reflex Pro Regular webfont can be set in branding settings.

Cloudflare Pages Free is the selected hosting target. See CLOUDFLARE-SETUP.md for the remaining account and OAuth steps. Netlify configuration above is retained as an unused alternative.
