# Chart Studio

A small, standalone chart maker. Open `index.html` in a browser; it has no build step or package dependencies.

The editor treats each row as a category and each numeric column as a series. Edit cells directly, add rows or series, or paste a spreadsheet table with headers in the first row and category names in the first column. The chart updates live. Available views include diverging Likert, horizontal/grouped/stacked bars, columns, line, area, scatter, pie, and donut. Chart title and subtitle are hidden by default; turn on their switches to add them. Export as SVG for a crisp, editable graphic or PNG for a raster image.

The included feedback data is fictional and exists only to preview the chart. For Likert charts, adjust the response range and endpoint labels; the midpoint count is split evenly across the center line. Agreement rows use a warm-to-green palette; bipolar rows use amber-to-blue. Row counts and gridlines are editable or toggleable. Chart values accept decimals and negative numbers for chart types that support them.

## Create a chart with a URL

Machine-readable instructions are available at [`/llms.txt`](./llms.txt) when this folder is hosted. The file is static, so any static server serves it alongside `index.html`.

Pass a JSON chart specification in the `chart` query parameter. Open the resulting URL to load the chart into the fully editable editor. Add `format=svg` or `format=png` to automatically download the corresponding file using the editor export controls.

```js
const spec = {
  type: 'bar',
  title: 'Quarterly sales',
  series: ['2025', '2026'],
  rows: [
    { label: 'Q1', values: [12, 18] },
    { label: 'Q2', values: [16, 24] }
  ]
};
const url = new URL('https://your-host.example/index.html');
url.searchParams.set('chart', JSON.stringify(spec));
console.log(url.href); // Open in the editor
url.searchParams.set('format', 'svg');
console.log(url.href); // Open to download SVG
url.searchParams.set('format', 'png');
console.log(url.href); // Open to download PNG
```

Replace the example host with wherever you serve this folder. Local `file:` URLs also work. `URLSearchParams` handles encoding, including spaces, Unicode, and punctuation; do not encode the JSON again.

Required fields are `type`, `series` (1–50 strings), and `rows` (1–500 objects with a string `label` and one finite numeric value per series). Types: `likert`, `bar`, `stacked`, `column`, `stacked-column`, `line`, `area`, `scatter`, `donut`, `pie`. Optional fields: `title`, `subtitle`, `lowLabel`, `highLabel`, `showCounts`, `showGrid`. A supplied title or subtitle is shown automatically. Likert charts use numbered response points starting at 1, at most 21 series, and nonnegative integer counts; rows may set `group: 'bipolar'` (otherwise `agreement`). Invalid specifications show an error and leave the sample editor available.

This is a browser-based URL interface: `format=svg` or `format=png` triggers a download after rendering, and leaves the chart editable. It is not an HTTP image endpoint for `curl` or `<img src>`; that would require a rendering server. Chart data is stored in the URL, so keep links small and avoid confidential data in shared links or browser history. Editing the chart does not update the original URL.
