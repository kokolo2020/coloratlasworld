import fs from "node:fs";

let svg = fs.readFileSync("public/maps/us-states.svg", "utf8");

svg = svg.replace(
  '<svg xmlns="http://www.w3.org/2000/svg" width="959" height="593">',
  '<svg role="img" aria-label="Map of the contiguous United States filled with the United States flag" xmlns="http://www.w3.org/2000/svg" width="959" height="593" viewBox="20 20 920 560">'
);
svg = svg.replace(/<path class="ak"[\s\S]*?<\/path>\r?\n/g, "");
svg = svg.replace(/<path class="hi"[\s\S]*?<\/path>\r?\n/g, "");
svg = svg.replace(/<path class="separator1"[\s\S]*?\/>\r?\n/g, "");

const redStripeRects = Array.from({ length: 7 }, (_, index) => {
  const y = 20 + index * 86;
  return `<rect x="20" y="${y}" width="920" height="43" fill="#bf0d2f"/>`;
}).join("\n  ");

const stars = Array.from({ length: 9 }, (_, row) => {
  const count = row % 2 ? 5 : 6;
  return Array.from({ length: count }, (_, col) => {
    const cx = 52 + col * 58 + (row % 2 ? 29 : 0);
    const cy = 48 + row * 30;
    return `<circle cx="${cx}" cy="${cy}" r="7" fill="#fff"/>`;
  }).join("\n  ");
}).join("\n  ");

const defs = `<defs>
<pattern id="usFlagFill" patternUnits="userSpaceOnUse" x="20" y="20" width="920" height="560">
  <rect x="20" y="20" width="920" height="560" fill="#fff"/>
  ${redStripeRects}
  <rect x="20" y="20" width="368" height="301" fill="#002868"/>
  ${stars}
</pattern>
<style type="text/css">
.state{fill:url(#usFlagFill);stroke:#ffffff;stroke-width:1.4;stroke-linejoin:round}
.borders{stroke:#ffffff;stroke-width:1.35}
.dccircle{display:yes}
</style>
</defs>`;

svg = svg.replace(/<defs>[\s\S]*?<\/defs>/, defs);

fs.writeFileSync("public/maps/us-contiguous-flag.svg", svg);
console.log("public/maps/us-contiguous-flag.svg");
