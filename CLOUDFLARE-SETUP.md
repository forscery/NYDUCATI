# Cloudflare Pages deployment

Selected hosting: Cloudflare Pages Free. Video: YouTube embeds; no video files need to be stored in this repository.

## Account steps still required

1. Authenticate GitHub publishing and upload this repository to `forscery/NYDUCATI`.
2. Sign in to Cloudflare, create a Pages project connected to that repository, and select `main`.
3. Use build command `npm run build`, output directory `dist`, root repository directory, and Node 22.22.0 or newer.
4. Preserve a private preview audience using Cloudflare Access before sharing/deploying the preview. The noindex headers prevent indexing but are not password protection.
5. Connect a GitHub OAuth application through a Cloudflare-compatible Decap OAuth service. Decap lists a community Cloudflare Pages implementation at https://decapcms.org/docs/external-oauth-clients/. Review its code before deployment. Configure its exact service URL as `backend.base_url` in `/admin/config.yml`; the present default still expects Netlify and is not a working Cloudflare login. Store secrets only in Cloudflare's secret settings.
6. Verify login, draft, publish, automatic rebuild, and sign-out. Verify original `.html` URLs and any Cloudflare clean-URL redirects before production cutover.

No Cloudflare account, project, OAuth application, or service has been provisioned yet. No DNS changes have been made. `netlify.toml` is retained only as an unused alternative.

## Video editing

The story editor has an optional YouTube videos list. Paste the video URL and caption; it appears beneath the story with a responsive player and a direct YouTube link. Videos load lazily and do not autoplay. Imported broken Blogger embeds are not automatically replaced: identify the corresponding YouTube uploads first.
