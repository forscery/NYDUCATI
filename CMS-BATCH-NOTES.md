# Consolidated CMS authoring revision

## Writing

The article now uses a focused visual editor with Markdown source and generated HTML views. Typing updates saved Markdown without replacing the editable DOM, and opening media preserves the selection range. There is an explicit dark caret. Use Add photos for multi-selection from disk or Google Photos (Google allows up to 20 per session). Banner and social-image fields remain single-image fields.

New inline photos appear as small thumbnails. Click one for larger preview, alt text, caption, replacement or removal. Existing photos without thumbnail variants are displayed compactly but still fetch their existing source. This revision does not migrate existing media.

## Image delivery

New converted uploads create three assets: a 960px maximum reading image, a 2200px maximum expanded/banner image, and a 240px editor thumbnail. Images are not upscaled. WebP encoding starts at quality 0.76 for reading images / 0.78 for large images and reduces quality toward 0.49 to try to meet 150KB / 450KB targets. These are targets, not size guarantees. Detailed scenes may remain larger, and the picker reports that. HEIC still images use the same path. Animated GIFs and other pass-through formats remain unchanged and can still be large.

Posts use the reading asset with stored dimensions and lazy loading. The larger asset is a click-to-open link and is not downloaded just by displaying the article. Banner fields use the large asset. Editor thumbnails use the smallest asset, except when an image is expanded for editing. More assets means more storage objects; the admin counts all variants.

## Media administration

The picker starts with new uploads. Existing files are behind Find an existing image, with filename search and pagination. Search scans bounded chunks; Load more continues searching. A separate Media administration link opens usage estimates and an explicitly loaded inventory, filterable by name and sortable by size. Sorting is global after the inventory has finished loading. Storage estimates assume the whole free allowance remains available for this bucket; other services/account-wide usage are not included.

## Social links

Pasting a standalone supported URL in Visual mode creates an embed card. Click the card to preview or choose Keep as plain link. Supported: Instagram /p/ and /reel/ URLs; Facebook canonical posts, videos, reels, watch and permalink URLs. Share-shortcut URLs, Stories, private/restricted/deleted content may remain links or fail at the provider. No claim of universal Meta embedding.

Public pages render lightweight click-to-load previews with a permanent provider link. No Meta iframe loads until requested. This avoids slowing photo-heavy posts or silently loading trackers. Existing standalone supported links also become embed cards on publication; links embedded inside prose stay links.

## Verification and limits

Automated tests cover ordered multi-photo insertion, preservation of the editing DOM during typing, variant dimensions/no-upscaling, GIF preservation, provider URL validation, plain-link opt-out, deferred full-size/media loads, authentication and migration regressions. Build validation includes current user-authored posts. Tests simulate Google/provider responses; signed-in Google and Meta playback and real browser caret behavior need live acceptance. There has been no new bulk migration, route visualization work, or change to post content in this batch.
