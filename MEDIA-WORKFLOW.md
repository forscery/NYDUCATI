# NYDUCATI media workflow

## New posts

Choose an image in the CMS. JPEG, PNG and WebP can be prepared as WebP; HEIC/HEIF always converts to a still WebP. Preparation occurs on the author's computer. Originals remain untouched. The uploader shows a prepared thumbnail, input/output sizes and final dimensions before upload. Maximum dimension is 2400 pixels, quality 0.86, with no upscaling. The decoder is downloaded from this site only if native HEIC decoding fails. It is not loaded on public blog pages.

GIF/AVIF files pass through unchanged. HEIC Live Photo motion, camera RAW and video conversion are not supported by this image uploader. HDR appearance and orientation should be checked with representative iPhone originals before bulk migration. A real public HEIC sample passed the decoder test; that is not a substitute for a browser upload with the owner's images.

## Batch conversion

The utility is deterministic and requires no AI while running. It accepts a folder of photos or the CMS's JSON posts (HTML or Markdown bodies). With posts, it inventories the image URLs already present in the content, rather than requiring Google Photos album downloads. It does not yet consume the Blogger XML export directly.

Inventory only (no image downloads):

    node scripts/batch-images.mjs content/posts /path/to/migration-output

Convert local photos, or download and convert the inventoried post images:

    node scripts/batch-images.mjs INPUT_FOLDER OUTPUT_FOLDER --convert

The output folder must be outside the input folder. Sources are never modified. Outputs use descriptive source filenames plus a content hash; identical source bytes share one output. The manifest records source URL/path, referring posts, measured source/prepared sizes, errors and review notes. Rerunning verifies existing output hashes and reuses completed files. Repeated remote URLs reuse the previously prepared version; remove that source's manifest entry to explicitly refresh it if the remote original changes.

Check sources flagged as low resolution. Never upscale to pretend that detail has been recovered. Keep acceptable Blogger originals and seek Google/iCloud originals only for exceptions. Animated GIF/WebP inputs are preserved rather than silently flattened.

This stage does NOT upload to R2, rewrite posts, or publish anything. The next stage must upload reviewed outputs, confirm availability and rewrite image references while preserving captions, links and ordering. It should use the manifest to resume and produce a review report before publication.

Measure storage after conversion:

    npm run media:estimate -- OUTPUT_FOLDER

For an accurate photo-only estimate, point the estimator to a folder containing only prepared images, excluding manifests and other documents. Supply account usage options when other buckets consume the free allowance.

## Videos

Host on YouTube and embed in posts. Keep originals. Avoid another lossy conversion unless needed for editing or upload bandwidth. Approximate output MB = duration in seconds × total bitrate in Mbps ÷ 8. File size alone cannot predict a quality-preserving reduction. Fast motion, 60 fps and HDR may need more bitrate than static footage. Browser photo conversion does not transcode video.

## Desktop source selection

Google Photos: a future official Picker API integration can let the owner search and select photos, including searches by album title. It requires one-time Google project/OAuth configuration and explicit selection; it is not an unattended whole-library crawler or a public album downloader.

iCloud Photos: use the synced Mac System Photo Library through the OS photo browser when available, or export originals from Photos to a local folder. Apple's native PhotoKit could support a richer local Mac utility; a generic website should not promise a direct iCloud web-library picker. No Google/iCloud account integration was added in this change.
