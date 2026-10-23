# Journeys

Journeys is a separate CMS collection. Italian Lakes lives at Journeys → The Italian Lakes. By motorcycle. Its URL remains /journeys/italian-lakes/.

Create a Journey with a title, introduction, banner, subtitle, optional SEO overrides, and an ordered list of existing posts or pages. Each list item lets you select the content by title and override its card title, summary or photograph without editing the original. Reorder items with the list's drag controls. Chapter numbering can be Roman, numeric or hidden.

The source post/page remains the authoritative content; no duplicate article is created. Draft source content is omitted publicly. Old URLs continue resolving through content aliases. Missing, mismatched or duplicate references are rejected at build time with a clear message. Remove a reference before permanently deleting its source entry.

Journeys have their own Save / Publish / Revert to draft controls, optional custom /journeys/slug/ URL, redirects, publication-revision check, search entries and sitemap entries. No GPS visualization or mapping is included. Those remain explicitly on hold.

Site settings only chooses which Journey to feature on the homepage and manages global navigation/appearance. It no longer holds the journey's title, introduction, chapter list or banner. The homepage banner itself remains a separate homepage design setting.

The existing individual Italian Lakes post templates still contain their original five-day navigation; this collection's ordering controls the landing-page chapter list. Generalizing individual-post navigation to arbitrary journey membership is not part of this change.

Validation: tests cover separate collection/configuration, references to both pages and posts, ordering, aliases, draft omission, duplicate/missing reference validation, preserved Italian Lakes URL, search, sitemap and deployed-revision manifest. The site build and existing automated tests pass. Signed-in CMS interaction is not yet verified.
