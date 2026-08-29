# Petmon Go bundled fonts

These WOFF2 files are subsets generated from the Google Fonts distributions of
Gaegu and Long Cang. The subset character set is collected from
`petmon-go-mini/src/**/*.{vue,ts,json,scss}` plus printable ASCII, so all text
currently shipped by the mini-program has a glyph in the bundled font.

- Gaegu: upstream v23, Light (300) and Bold (700)
- Long Cang: upstream v21, Regular (400)
- License: SIL Open Font License 1.1, see `OFL.txt`
- The CSS family names are `Petmon Gaegu` and `Petmon Long Cang` because the
  OFL prohibits reusing a Reserved Font Name for a modified subset.

Regenerate with FontTools:

```sh
pyftsubset input.ttf --text-file=chars.txt --flavor=woff2 --output-file=output.woff2 --layout-features='*'
```

The mini-program uses these packaged `@font-face` resources directly, so no
download-file legal domain is required at runtime. If a future build switches
back to network fonts, add `fonts.gstatic.com` to the mini-program's download-
file legal domains in the WeChat platform console.
