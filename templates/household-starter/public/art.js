import { palettes, scenes } from "./model.js";
// A small original print generator. Only known palettes and paths enter the SVG.
const paths = {
  valley: [
    "M0 148 Q77 64 166 130 T360 86 V210H0Z",
    "M0 158 Q80 129 151 155 T360 110 V210H0Z",
  ],
  islands: [
    "M0 152 Q40 98 94 145 Q139 172 208 132 T360 123 V210H0Z",
    "M0 172 Q65 137 115 165 T220 158 T360 152 V210H0Z",
  ],
  dunes: [
    "M0 150 Q110 79 196 105 T360 116 V210H0Z",
    "M0 168 Q68 185 163 130 T360 147 V210H0Z",
  ],
};
export function printSVG({ palette, scene }) {
  palette =
    typeof palette === "string" && Object.hasOwn(palettes, palette)
      ? palette
      : "orchard";
  scene = scenes.includes(scene) ? scene : "valley";
  const [sky, sun, hill, front] = palettes[palette];
  const [back, near] = paths[scene];
  const lines = Array.from(
    { length: 7 },
    (_, i) =>
      `<path d="M-12 ${175 + i * 6} Q80 ${148 + i * 7} 175 ${172 + i * 6} T372 ${145 + i * 7}"/>`,
  ).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" role="img" aria-label="A ${scene} landscape in ${palette} colors"><rect width="360" height="210" fill="${sky}"/><g fill="none" stroke="${hill}" stroke-width="1" opacity=".55"><path d="M0 78Q105 42 208 63T360 44M0 86Q105 50 208 71T360 52M0 94Q105 58 208 79T360 60"/></g><circle cx="260" cy="64" r="27" fill="${sun}"/><path d="${back}" fill="${hill}"/><path d="${near}" fill="${front}"/><g fill="none" stroke="${sky}" opacity=".54" stroke-width="1.1">${lines}</g><g stroke="${front}" stroke-width="2" fill="none" stroke-linecap="round"><path d="M68 49q5 -3 9 2q4 -5 9 -4m8 -8q4 -3 7 1q4 -4 8 -3"/></g></svg>`;
}
