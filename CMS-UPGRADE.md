# CMS upgrade — October 23, 2026

This batch replaces the custom contenteditable writer with locally bundled, free Tiptap. No paid editor platform is used. Existing posts are not rewritten by deployment.

## Writing

Posts, Pages and Journeys share icon controls with tooltips, including italic (Ctrl/Cmd+I), bold, underline, strike, headings, nested lists, alignment, quotes, tables, code blocks, links and find/replace one occurrence at a time. Visual, Markdown and editable HTML views share the same content. HTML is sanitized; this is not a code validator. Legacy styled containers are preserved as blocks; their markup remains editable in HTML mode.

Photos stay compact in the writer. Click one for alt text, caption, replacement, removal or banner selection. Bulk uploading keeps selection order. The first successful inserted photo sets the banner only when no banner exists. Existing photo library results show thumbnails, names and sizes. Newly uploaded variants are linked together; choosing a reading image retains its full-size counterpart. Older files without variant metadata fall back to their original image.

Text width is 760px or 1000px. Wide images may extend to 1200px, bounded by the viewport. These apply to the body, not the full-screen banner. Site settings hold reusable defaults; individual items can inherit or override them. Preview reflects the same width classes. Banner fields include exact words to italicize in the title.

Local draft recovery stores a copy in this browser after editing pauses. Reopening offers Restore or Discard. It does not publish, does not sync across devices, and is cleared after saving. Browser storage restrictions can prevent it; a visible warning is shown.

Automatic new slugs shorten at a word boundary around 75 characters. Explicit manual slugs and existing URLs are preserved. Excerpts use an explicit override, otherwise text before a read-more marker or the first 220 characters.

## Publishing and administration

The toolbar distinguishes unsaved changes, saved drafts, scheduled publication and unverified deployment. Check deployed revision compares the content fingerprint with the live build. A failed verification is not proof a deployment failed; check Cloudflare build logs for the actual build failure. Save and Publish still use Decap validation/GitHub persistence.

Content administration is a separate link beside Media administration. It filters by text/tags, type and status, and applies tags, draft/publish or feed visibility to selected records in one Git commit. It refuses to save when main changed after loading, to protect newer edits. Reload any editor tab after making bulk changes.

## Scheduled publication

Use the schedule field to select local time and an IANA timezone, then Publish. The date displayed on the article remains independently editable. Nonexistent and ambiguous daylight-saving times are rejected. Future scheduled records are omitted from pages, journeys, feeds, search, sitemap and publication status until due.

The included GitHub Actions workflow checks every 15 minutes and records newly due items in one scheduler commit, triggering the repository's existing Cloudflare Git build. It requires GitHub Actions to be enabled and repository policy to allow workflow contents:write. It uses the built-in GitHub token; no additional secret is required. GitHub schedules may be delayed or disabled on inactive public repositories. This is best-effort scheduled publication, not exact-minute delivery. Check the first scheduled run in GitHub Actions and its Cloudflare build before relying on unattended publication. A concurrent user push causes the scheduler push to fail safely; the next scheduled run retries.

## Embeds, gallery and tracking

Pasting supported YouTube watch, short and Shorts URLs creates responsive embeds, with auto/landscape/portrait controls. Instagram posts/reels and supported Facebook posts/videos use provider-managed embeds rather than fixed-height scrolling iframes. Providers determine final size and availability; Instagram/Facebook Stories are not supported permanent embeds. A pasted story displays an explanatory editor notice. No custom “View on Instagram” link is added. Provider branding cannot be removed.

The gallery uses a transparent image container over a dimmed page, with previous/next buttons, keyboard arrows, swipe, caption and counter. Large images load on opening; only immediate neighbours are prefetched.

Site settings include GA4, GTM, Search Console verification and allowed production hostnames. Tracking defaults to off. GTM takes precedence over direct GA4, so configure other tools and GA4 in GTM when using it. Preview hosts do not send analytics unless deliberately listed as production. No IDs have been invented or enabled.

## Verification boundaries

Automated DOM tests exercise the actual Tiptap parser/commands and preserve current article text and image URLs. Unit/integration checks cover existing auth/media, scheduling rules, DST, output, search and publication fingerprints. Actual signed-in browser editing, Google account selection, third-party provider rendering and the first timed Cloudflare deployment still need live acceptance. No bulk archive migration or route visualization was performed.
