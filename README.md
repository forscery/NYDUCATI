# NYDUCATI CMS demo

Cloudflare Worker + Astro + Decap. The live Blogger domain is unchanged. Search indexing remains disabled for the preview.

## Writing

Open `/admin/` and sign in with GitHub. Posts and Pages are separate sections. The article editor has Visual and Markdown source modes, a styled preview, and a read-only generated HTML view. It is not a page builder. Existing demo articles were converted to editable Markdown; their original HTML remains in `migration/originals/`. Automated checks compare all prose, image URLs and links before/after conversion.

The inline image button opens the NYDUCATI R2 picker. It uploads to the `MEDIA` binding and inserts an absolute image URL. Select a hosted image or upload a local photo. Optional web preparation makes one WebP copy with a maximum long edge of 2400 pixels at quality 0.86, without upscaling. GIF and AVIF are uploaded unchanged. Originals are not modified. SVG and videos are not accepted. Use YouTube links for videos.

Uploads are public immediately, independently of a post's draft status. The picker checks existing bucket bytes and shows projected storage before uploading. A failed post save does not remove an uploaded photo; it can be selected again. Existing Blogger photo URLs have NOT yet been migrated to R2. No bulk media upload is performed by the application or build.

## Fields and site behavior

Posts/pages support URL, publication date picker, author, labels, excerpt, draft state, feed/search visibility, location/map link, SEO title/description/social image, banner, width presets and YouTube links. URL changes through the CMS save hook retain the previous URL as a redirect. Previous URL aliases can also be edited explicitly. Draft content is excluded from built routes. Hidden-from-feed content retains a public URL; it is not private. Draft linked pages are removed from menus.

Posts appear in a date-sorted masonry feed with pagination. Pages stay out of that feed. Labels generate tag archives, dates generate monthly archives. RSS is at `/rss.xml`, the sitemap is at `/sitemap.xml`. Search includes article text, tags and locations. Original label text is retained; generated tag paths use a collision-safe slug, with redirects from corresponding Blogger label URLs.

The five demo posts retain their known year/month from the original URLs. Exact original dates, labels and locations remain unimported pending Blogger metadata/export. Unknown dates are blank; RSS omits unknown pubDate rather than inventing one. Tags appear when supplied in the CMS or imported.

Site settings controls menu ordering, visibility, one submenu level, banners, featured journey and posts per page. Original three menu links are preserved. The featured Italian Lakes overview remains a five-part journey template; posts are not restricted to those groupings.

## Revision history

Each article links to its own GitHub file history. An updated timestamp is derived at build time from that file's meaningful content changes. Migration/schema-only baselines are excluded, as are unrelated site changes. Cloudflare builds fetch full history when the checkout is shallow. If history cannot be read, the link remains but no timestamp is fabricated. The original publication date is independent of Git dates.

## Cloudflare

`wrangler.jsonc` deploys the existing `nyducati` Worker, static output `dist`, OAuth routes, and media routes. R2 bucket `nyducati-media` is bound as `MEDIA`. Existing runtime secrets `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` remain required for login. Uploads/listings require a GitHub token with write permission on `forscery/NYDUCATI`. Images are served from `/media/`; the bucket does not require a public r2.dev URL.

Worker-mediated media requests count toward Workers usage separately from R2. Current R2 estimates are not a guarantee of an all-inclusive Cloudflare bill. Set account usage alerts and check other services/buckets before bulk migration.

Keep `indexingEnabled` OFF until launch. That setting controls robots meta, response headers and robots.txt. Canonicals, RSS and sitemap target the eventual production domain `https://www.nyducati.com`; DNS has not been changed.

## Checks and cost estimate

Use Node 22.22+:

- `npm ci`
- `npm run build`
- `npm test`
- `node scripts/check-integration.mjs` — temporary fixtures, restored afterward.
- `node scripts/check-history.mjs` — isolated Git history scenarios.
- `npm run media:estimate -- /path/to/prepared-images --existing-gb 0 --other-writes 0 --other-reads 0`

The cost command inventories actual prepared files and hashes duplicates, then estimates full-month Standard storage and operations with free allowances and billing-unit rounding. Supply existing account usage; defaults assume unused allowances. It does not upload. It excludes Workers, paid transformations, taxes, original-download services and development/AI costs. Recheck rates before bulk migration: https://developers.cloudflare.com/r2/pricing/ (rate snapshot 2026-10-20).

Browser-based editor and authenticated R2 upload must be checked on the live deployment. Local browser automation is unavailable because its security-policy check failed. Automated tests cover CMS configuration, conversion fidelity, auth/media handlers, archives, RSS, redirects, metadata and cost calculations.

## Authoring controls

Tags use a single comma/newline-separated text box. The CMS uses direct saves to main rather than review-status branches. New posts default to draft. Save keeps the current publication state; Publish saves with draft=false; Revert to draft saves with draft=true. Saving an already published post updates it. The toolbar links to its published preview-domain URL; Cloudflare must finish a successful build before changes are visible. Reverting also requires a successful deployment before removal takes effect.

The pinned Decap 3.17.1 toolbar is adapted in prepare-cms.mjs with a guarded replacement that fails the build if its boundaries change. It retains native form validation, preSave hooks, persistence and error reporting. Review this adapter when upgrading Decap.

The image picker prepares JPEG/PNG/WebP as WebP locally (2400-pixel maximum, quality 0.86, no upscaling); GIF/AVIF pass through. HEIC/HEIF now converts to still WebP through native decoding or a lazy-loaded local decoder; camera RAW is not supported. Single-image fields explicitly disable multiple selection. Legacy image arrays are normalized when rendering so one such value cannot block deployment.

See MEDIA-WORKFLOW.md for HEIC handling, batch conversion commands, measured migration planning and the remaining R2 rewrite step.
