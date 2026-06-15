# Partner logos

Drop rights-cleared logo files here (SVG preferred, or transparent PNG), e.g.
`who.svg`, `fao.svg`, `worldbank.svg`.

Then set the matching partner's `logo` field in `js/data.js` (`BBI.partners`) to
the path, e.g.:

    { group: 'funder', short: 'WHO', name: 'World Health Organization',
      url: 'https://www.who.int', logo: 'assets/partners/who.svg' },

The tile shows the image (greyscale, full‑colour on hover). With no file it shows
a styled wordmark. Use official press‑kit / brand assets you have permission to
display — do not hotlink logos from third‑party sites.
