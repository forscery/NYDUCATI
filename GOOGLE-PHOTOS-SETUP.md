# Connect Google Photos to the CMS

The implementation adds **Choose from Google Photos** to the shared image picker used by inline images, banners and social-sharing images. It opens Google's selection page, retrieves the photos you select, prepares them through the existing WebP/HEIC flow, previews them, and uploads to R2 when you click Upload selected images. Google originals remain untouched. No Google links or tokens are saved in posts.

## One-time account setup

1. Open Google Cloud Console and choose or create a project.
2. Enable **Google Photos Picker API** in APIs & Services → Library.
3. Configure Google Auth Platform's consent screen/branding and audience. For a personal account, use External and Testing; add your Google Photos account as a test user.
4. Add this data-access scope: `https://www.googleapis.com/auth/photospicker.mediaitems.readonly`.
5. Create an OAuth client of type **Web application**. Set its **Authorized JavaScript origin** to exactly:

   `https://nyducati.hidden-silence-47e4.workers.dev`

   No `/admin` suffix. This uses Google's popup token flow: it does not use an authorization callback URL or a client secret.
6. Copy the client ID (ends in `.apps.googleusercontent.com`). In Cloudflare → Workers & Pages → nyducati → Settings → Variables and Secrets, add `GOOGLE_PHOTOS_CLIENT_ID` with that value and deploy the configuration change. The client ID is public configuration, not a secret.
7. Reload the CMS, open either an inline image or banner image picker, and choose **Choose from Google Photos**. Authorize your Google account. Click the displayed **Open Google Photos to choose images** link, select photographs, and click Done. The CMS will retrieve and prepare them. Review the thumbnails, then upload/insert.

## Behavior and limitations

- This is Google's official user-selected picker, not an unattended library or public-album crawler. Google's selection UI controls browsing/search; our CMS does not expose a separate album browser.
- Google tokens are held only in memory for the selection, never localStorage or saved post content. Sign-in may be needed again on the next selection. The Worker requires existing GitHub repository write access for every request.
- Videos are rejected with a message to use YouTube. HEIC motion becomes a still image. Animated images follow the existing preparation behavior.
- Selection supports one image for single-image fields and up to 20 for multi-image fields. Download is limited to 50 MB per source, and existing R2 upload limits still apply.
- The Google script loads only in the authoring media dialog. Public pages do not load it.
- Closing the picker cancels processing; completed remote selection sessions are deleted on exit when possible. Google session expiration handles abandoned browser tabs.
- Automated tests cover the server path with simulated Google responses. Actual Google consent/selection requires the configured client ID and a signed-in account; it has not yet been verified end to end.

Official references:
- https://developers.google.com/photos/picker/guides/get-started-picker
- https://developers.google.com/identity/oauth2/web/guides/use-token-model
