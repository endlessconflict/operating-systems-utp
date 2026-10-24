// node assets/banner/build.mjs  ->  assets/banner.svg (animated, self-contained: tokens, fonts and art inlined)
// Ring Zero holo style: isometric plates, extruded foil logos, chromatic ghosts, scanlines.
// Foil Tux technique from the boot-chain cover (diffuse + specular lighting maps over the Tux outline paths).
// Tokens are read from the sibling ring-zero-design-system checkout (../../../ring-zero-design-system/tokens.css).
// Fonts are static subsets of the Ring Zero variable fonts (fontTools instancer + subsetter, ASCII + "·").
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const read = (f) => fs.readFileSync(path.join(here, f), 'utf8');
const b64 = (f) => fs.readFileSync(path.join(here, f)).toString('base64');
const W = 1584, H = 396;

// ---------- Tux (Larry Ewing, Simon Budig, Garrett LeSage; see LICENSE-NOTE.txt) ----------
const tux = read('tux.svg');
const d = (id) => { const m = tux.match(new RegExp(`<path id="${id}"[^>]*?\\sd="([^"]+)"`, 's')); if (!m) throw new Error(id); return m[1].replace(/\s+/g, ' '); };
const P1 = (id) => `<path d="${d(id)}"/>`;
const sil = ['body_base', 'wing_left_base', 'wing_right_base', 'wing_tip_right_base', 'foot_left_base', 'foot_right_base', 'beak_base'].map(P1).join('');
const SIL = '<use href="#sil"/>';
function grabDef(id) {
  const open = tux.search(new RegExp(`<(radialGradient|linearGradient|filter|clipPath)[^>]*\\sid="${id}"`));
  if (open < 0) throw new Error('def ' + id);
  const tag = tux.slice(open).match(/^<(\w+)/)[1];
  const head = tux.slice(open).match(/^<[^>]*>/)[0];
  if (head.endsWith('/>')) return head;
  return tux.slice(open, tux.indexOf(`</${tag}>`, open) + tag.length + 3);
}
function grabGroup(id) {
  const start = tux.indexOf(`<g id="${id}"`);
  let depth = 0, end = start, m;
  const re = /<g[\s>]|<\/g>/g; re.lastIndex = start;
  while ((m = re.exec(tux))) { if (m[0].startsWith('</')) { if (--depth === 0) { end = m.index + 4; break; } } else depth++; }
  return tux.slice(start, end).replace(/\s+/g, ' ');
}
const EYEDEFS = ['gradient_eyeball', 'gradient_pupil_left_glare', 'gradient_pupil_right_glare_2', 'gradient_eyelid_left', 'gradient_eyelid_right', 'gradient_eyebrow',
  'fill_eyeball_left', 'fill_eyeball_right', 'fill_pupil_left_glare', 'fill_pupil_right_glare', 'fill_eyelid_left', 'fill_eyelid_right', 'fill_eyebrow_left', 'fill_eyebrow_right',
  'blur_pupil_left_glare', 'blur_pupil_right_glare', 'blur_eyebrow_left', 'blur_eyebrow_right', 'clip_eye_left', 'clip_eye_right', 'clip_pupil_left', 'clip_pupil_right'].map(grabDef).join('');
const EYES = grabGroup('eyes').replace(/<path id="(?:eyelid|eyebrow)_(?:left|right)"[^>]*\/>/g, '');
const eyeballs = ['eyeball_left', 'eyeball_right'].map(P1).join('');
const footFill = 'color-mix(in srgb, var(--kapton-400) 84%, var(--gray-100))';
const tuxFace = `
 <g fill="var(--gray-950)">${SIL}</g>
 <g clip-path="url(#silc)">
  <rect x="-10" y="-10" width="240" height="280" fill="var(--gray-950)"/>
  <path d="${d('belly')}" fill="var(--gray-100)"/>
  <path d="${d('belly')}" fill="url(#film)" opacity=".15" style="mix-blend-mode:multiply"/>
  <path d="${d('belly')}" fill="url(#bsheen)" style="mix-blend-mode:screen"/>
  <g filter="url(#diff)" style="mix-blend-mode:multiply">${SIL}</g>
  <g filter="url(#spec)" style="mix-blend-mode:screen" opacity=".6">${SIL}</g>
  <g fill="none" stroke="var(--ice-200)" stroke-width="9" stroke-linejoin="round" filter="url(#fres)" opacity=".55" style="mix-blend-mode:screen">${SIL}</g>
  <path d="${d('wing_left_base')}" fill="var(--gray-1000)"/><path d="${d('wing_right_base')}" fill="var(--gray-1000)"/>
  <g fill="none" stroke="var(--ice-200)" stroke-width="1" opacity=".7"><path d="${d('wing_left_base')}"/><path d="${d('wing_right_base')}"/></g>
  <g style="mix-blend-mode:screen" opacity=".16"><path d="${d('wing_left_base')}" fill="url(#film)"/><path d="${d('wing_right_base')}" fill="url(#film)"/></g>
  <g fill="var(--gray-300)" opacity=".3" filter="url(#tipgl)" style="mix-blend-mode:screen"><path d="${d('wing_left_glare')}"/><path d="${d('wing_right_glare')}"/></g>
  <path d="${d('foot_left_base')}" fill="${footFill}"/><path d="${d('foot_right_base')}" fill="${footFill}"/>
  <path d="${d('foot_left_layer_1')}" fill="var(--kapton-600)" opacity=".55"/><path d="${d('foot_right_layer_1')}" fill="var(--kapton-600)" opacity=".55"/>
  <g style="mix-blend-mode:screen" opacity=".3"><path d="${d('foot_left_base')}" fill="url(#film)"/><path d="${d('foot_right_base')}" fill="url(#film)"/></g>
  <g fill="var(--gray-1000)" stroke="var(--gray-1000)" stroke-width="2.4" opacity=".62" filter="url(#rg)"><path d="${d('eyeball_left')}"/><path d="${d('eyeball_right')}"/></g>
  ${EYES}
  <g clip-path="url(#clipFootR)" opacity=".34" filter="url(#tipsh)" fill="var(--kapton-900)"><path d="${d('wing_tip_right_shadow_lower')}"/><path d="${d('wing_tip_right_shadow_upper')}"/></g>
  <path d="${d('wing_tip_right_base')}" fill="var(--gray-1000)"/>
  <g clip-path="url(#clipTip)" filter="url(#tipgl)" fill="var(--gray-300)" opacity=".38"><path d="${d('path_wing_tip_right_glare')}"/></g>
  <path d="${d('wing_tip_right_base')}" fill="none" stroke="var(--ice-200)" stroke-width="1" opacity=".7"/>
  <path d="${d('beak_base')}" fill="var(--gray-950)"/>
  <path d="${d('mandible_lower_base')}" fill="var(--kapton-600)"/>
  <path d="${d('mandible_lower_glare')}" fill="var(--kapton-200)" opacity=".4" clip-path="url(#clipLow)"/>
  <path d="${d('mandible_upper_shadow')}" fill="var(--kapton-900)" opacity=".55" clip-path="url(#clipLow)"/>
  <path d="${d('mandible_upper_base')}" fill="var(--kapton-400)"/>
  <path d="${d('mandible_upper_glare')}" fill="var(--kapton-50)" opacity=".6" clip-path="url(#clipUp)"/>
  <path d="${d('naris_left')}" fill="var(--kapton-900)" opacity=".6"/><path d="${d('naris_right')}" fill="var(--kapton-900)" opacity=".6"/>
  <rect x="-10" y="-10" width="240" height="280" fill="url(#halo)" style="mix-blend-mode:screen" mask="url(#noeyesF)"/>
  <rect class="sweep" x="-10" y="-10" width="240" height="280" fill="url(#streak)" style="mix-blend-mode:screen" mask="url(#noeyesF)"/>
 </g>`;
let tuxExt = '';
for (let i = 12; i >= 1; i--) {
  const h = i % 2 ? 'uv-400' : 'ice-400';
  tuxExt += `<g transform="translate(${(i * 0.95).toFixed(2)},${(-i * 0.57).toFixed(2)})"><g fill="none" stroke="var(--${h})" stroke-width=".85" stroke-linejoin="round">${SIL}</g><g fill="color-mix(in srgb, var(--${h}) ${16 + (12 - i)}%, var(--gray-1000))">${SIL}</g></g>`;
}

// ---------- isometric geometry ----------
const C = Math.cos(Math.PI / 6);
const iso = (cx, cy) => (x, y, z = 0) => [cx + (x - y) * C, cy + (x + y) * 0.5 - z];
const pt = (p) => p.map((v) => v.toFixed(1)).join(',');
const poly = (ps) => ps.map(pt).join(' ');

function pedestal(cx, cy, a, label, th = 16) {
  const P = iso(cx, cy);
  const T = [P(-a, -a), P(a, -a), P(a, a), P(-a, a)];
  const B = T.map(([x, y]) => [x, y + th]);
  let s = `<polygon points="${poly([T[3], T[2], B[2], B[3]])}" fill="var(--uv-900)" stroke="var(--uv-400)" stroke-width="2"/>`;
  s += `<polygon points="${poly([T[2], T[1], B[1], B[2]])}" fill="var(--gray-900)" stroke="var(--ice-400)" stroke-width="2"/>`;
  for (let k = 1; k < 9; k++) {
    const t = -a + (2 * a * k) / 9;
    const [x1, y1] = P(t, a), [x2, y2] = P(t, a + 16);
    s += `<line x1="${x1.toFixed(1)}" y1="${(y1 + th * 0.6).toFixed(1)}" x2="${x2.toFixed(1)}" y2="${(y2 + th * 0.6 + 3).toFixed(1)}" stroke="var(--ice-400)" stroke-width="2.5" stroke-linecap="round" opacity=".5"/>`;
    const [u1, v1] = P(a, t), [u2, v2] = P(a + 16, t);
    s += `<line x1="${u1.toFixed(1)}" y1="${(v1 + th * 0.6).toFixed(1)}" x2="${u2.toFixed(1)}" y2="${(v2 + th * 0.6 + 3).toFixed(1)}" stroke="var(--uv-400)" stroke-width="2.5" stroke-linecap="round" opacity=".5"/>`;
  }
  s += `<polygon points="${poly(T)}" fill="var(--gray-950)" stroke="var(--uv-400)" stroke-width="2.5" stroke-linejoin="round"/>`;
  s += `<polygon points="${poly(T)}" fill="url(#foil)" opacity=".28" style="mix-blend-mode:screen"/>`;
  const D = a * 0.55, dz = 8;
  const dt = [P(-D, -D, dz), P(D, -D, dz), P(D, D, dz), P(-D, D, dz)], db = [P(-D, -D), P(D, -D), P(D, D), P(-D, D)];
  s += `<polygon points="${poly([dt[3], dt[2], db[2], db[3]])}" fill="var(--uv-600)"/><polygon points="${poly([dt[2], dt[1], db[1], db[2]])}" fill="var(--ice-600)"/>`;
  s += `<polygon points="${poly(dt)}" fill="var(--gray-900)" stroke="var(--ice-400)" stroke-width="2"/>`;
  // label plate on the front-left face, sized from the mono advance (0.8 em in Martian Mono)
  const [lx, ly] = P(-a, a); const w = Math.ceil(label.length * 18 * 0.8 + 22);
  s += `<g transform="translate(${(lx + 18).toFixed(1)},${(ly + th - 2).toFixed(1)})"><rect width="${w}" height="30" rx="3" fill="var(--gray-1000)" stroke="var(--ice-400)" stroke-width="2"/><text x="${w / 2}" y="21" text-anchor="middle" class="mono7" font-size="18" fill="var(--ice-200)">${label}</text></g>`;
  return s;
}

// floor: an open isometric grid centred on the pedestal, fading out radially so the
// words on the left sit on the same ground without a hard board edge
function floor() {
  const P = iso(PED.tux[0], PED.tux[1] + 40), a = 1000, step = 44;
  let s = '';
  for (let x = -a; x <= a; x += step) {
    const [x1, y1] = P(x, -a), [x2, y2] = P(x, a), [u1, v1] = P(-a, x), [u2, v2] = P(a, x);
    s += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"/><line x1="${u1.toFixed(1)}" y1="${v1.toFixed(1)}" x2="${u2.toFixed(1)}" y2="${v2.toFixed(1)}"/>`;
  }
  return `<g stroke="var(--ice-400)" stroke-opacity=".2" stroke-width="1">${s}</g>`;
}

// one pedestal; traces leave its front faces and dissolve into the floor
const PED = { tux: [1230, 280] }, SZ = 84, TH = 16;
const trace = (pts) => `M${pts.map(pt).join(' L')}`;
const [px, py] = PED.tux;
// left bus runs from the chip to the end of the stats line, right one to a node on the floor
const STATS_END = 72 + 34 * 19 * 0.7 + 20, BUS_Y = 327;
const lf = [px - SZ * C, py + SZ / 2 + TH], rf = [px + SZ * C, py + SZ / 2 + TH];
const traces = [
  trace([lf, [lf[0] - 22, BUS_Y], [STATS_END, BUS_Y]]),
  trace([rf, [rf[0] + 30, rf[1] + 17], [px + 290, rf[1] + 17]]),
  trace([[px, py + SZ + TH], [px, H]]),
];
const nodes = [[STATS_END, BUS_Y, 'ice'], [px + 290, rf[1] + 17, 'uv']]
  .map(([x, y, r]) => `<rect x="${(x - 5).toFixed(1)}" y="${y - 5}" width="10" height="10" rx="2" fill="var(--${r}-400)"/>`).join('');

const tokens = read('../../../ring-zero-design-system/tokens.css').match(/:root,\[data-theme="pitch"\]\{([\s\S]*?)\}/)[1];
const bands = `<stop offset="0" stop-color="var(--ice-400)"/><stop offset=".2" stop-color="var(--uv-400)"/><stop offset=".4" stop-color="var(--flare-400)"/><stop offset=".6" stop-color="var(--kapton-400)"/><stop offset=".8" stop-color="var(--ice-200)"/><stop offset="1" stop-color="var(--ice-400)"/>`;
const streakStops = `<stop offset=".38" stop-color="#fff" stop-opacity="0"/><stop offset=".455" stop-color="#fff" stop-opacity=".16"/><stop offset=".5" stop-color="#fff" stop-opacity=".7"/><stop offset=".545" stop-color="#fff" stop-opacity=".16"/><stop offset=".62" stop-color="#fff" stop-opacity="0"/>`;
const lighting = (id, sd, scale) => `
 <filter id="diff${id}" x="-10%" y="-10%" width="120%" height="120%" color-interpolation-filters="sRGB"><feGaussianBlur in="SourceAlpha" stdDeviation="${sd * 1.4}" result="h"/><feDiffuseLighting in="h" surfaceScale="${scale * 1.1}" diffuseConstant="1.15" lighting-color="#fff" result="l"><feDistantLight azimuth="225" elevation="52"/></feDiffuseLighting><feComposite in="l" in2="SourceAlpha" operator="in"/></filter>
 <filter id="spec${id}" x="-10%" y="-10%" width="120%" height="120%" color-interpolation-filters="sRGB"><feGaussianBlur in="SourceAlpha" stdDeviation="${sd}" result="h"/><feSpecularLighting in="h" surfaceScale="${scale}" specularConstant="1.1" specularExponent="22" lighting-color="#e0f9ff" result="s"><feDistantLight azimuth="225" elevation="38"/></feSpecularLighting><feComposite in="s" in2="SourceAlpha" operator="in"/></filter>`;

// Tux placement: 216 x 256 art units, feet at y ~ 245
const TK = 1.0, TX = PED.tux[0] - 108 * TK, TY = PED.tux[1] - 250 * TK;
const FOOT = PED.tux[1] - 4;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-labelledby="t">
<title id="t">Operating Systems, UTP 2026. 5 labs, 6 assignments, 1 project. Holographic Tux standing on an isometric chip plate.</title>
<style>
@font-face{font-family:"RZ Display";src:url(data:font/woff2;base64,${b64('fonts/bricolage-800.woff2')}) format("woff2");font-weight:800}
@font-face{font-family:"RZ Mono";src:url(data:font/woff2;base64,${b64('fonts/martian-500.woff2')}) format("woff2");font-weight:500}
@font-face{font-family:"RZ Mono";src:url(data:font/woff2;base64,${b64('fonts/martian-700.woff2')}) format("woff2");font-weight:700}
:root{${tokens}}
.disp{font-family:"RZ Display","Arial Black",sans-serif;font-weight:800;letter-spacing:-.035em}
.mono5{font-family:"RZ Mono",ui-monospace,monospace;font-weight:500}
.mono7{font-family:"RZ Mono",ui-monospace,monospace;font-weight:700}
@keyframes sweep{0%,55%{transform:translateX(-230px)}100%{transform:translateX(230px)}}
@keyframes flow{to{stroke-dashoffset:-48}}
@keyframes pulse{0%,100%{opacity:.28}50%{opacity:.42}}
@keyframes ghost{0%,92%,100%{transform:translateX(0)}94%{transform:translateX(-5px)}96%{transform:translateX(4px)}}
.sweep{animation:sweep 7s ease-in-out infinite}
.flow{stroke-dasharray:10 14;animation:flow 1.6s linear infinite}
.cone{animation:pulse 5s ease-in-out infinite}
.gh1{animation:ghost 9s infinite}
.gh2{animation:ghost 9s -.1s infinite reverse}
@media (prefers-reduced-motion:reduce){*{animation:none!important}}
</style>
<defs>
 <linearGradient id="foil" x1="0" y1="0" x2="1" y2="1">${bands}</linearGradient>
 <radialGradient id="film" gradientUnits="userSpaceOnUse" cx="100" cy="150" r="46" spreadMethod="reflect" gradientTransform="translate(100 150) rotate(-28) scale(.8 1.25) translate(-100 -150)">${bands}</radialGradient>
 <linearGradient id="streak" gradientUnits="userSpaceOnUse" x1="30" y1="10" x2="190" y2="150">${streakStops}</linearGradient>
 <linearGradient id="halo" gradientUnits="userSpaceOnUse" x1="30" y1="10" x2="190" y2="150"><stop offset=".25" stop-color="var(--ice-200)" stop-opacity="0"/><stop offset=".5" stop-color="var(--ice-200)" stop-opacity=".14"/><stop offset=".75" stop-color="var(--ice-200)" stop-opacity="0"/></linearGradient>
 <linearGradient id="bsheen" gradientUnits="userSpaceOnUse" x1="60" y1="70" x2="150" y2="190"><stop offset="0" stop-color="var(--ice-200)" stop-opacity="0"/><stop offset=".35" stop-color="var(--ice-200)" stop-opacity=".3"/><stop offset=".55" stop-color="var(--gray-0)" stop-opacity=".24"/><stop offset="1" stop-color="var(--uv-200)" stop-opacity="0"/></linearGradient>
 <linearGradient id="rimfade" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="216" y2="200"><stop offset="0" stop-color="#fff"/><stop offset=".45" stop-color="#fff" stop-opacity=".25"/><stop offset="1" stop-color="#000"/></linearGradient>
 <mask id="rim" maskUnits="userSpaceOnUse" x="-20" y="-20" width="260" height="300"><rect x="-20" y="-20" width="260" height="300" fill="url(#rimfade)"/></mask>
 <mask id="noeyesF" maskUnits="userSpaceOnUse" x="-10" y="-10" width="240" height="280"><rect x="-10" y="-10" width="240" height="280" fill="#fff"/><g fill="#000">${eyeballs}</g></mask>
 ${EYEDEFS}
 <g id="sil">${sil}</g>
 <clipPath id="silc">${sil}</clipPath>
 <clipPath id="clipFootR">${P1('foot_right_base')}</clipPath>
 <clipPath id="clipTip">${P1('wing_tip_right_base')}</clipPath>
 <clipPath id="clipUp">${P1('mandible_upper_base')}</clipPath>
 <clipPath id="clipLow">${P1('mandible_lower_base')}</clipPath>
 <filter id="tipsh" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.4"/></filter>
 <filter id="tipgl" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation=".9"/></filter>
 <filter id="glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="8"/></filter>
 <filter id="tglow" x="-10%" y="-50%" width="120%" height="200%"><feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
 <filter id="rg" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2.2"/></filter>
 <filter id="fres" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="3"/></filter>
 ${lighting('', 5, 8)}
 <linearGradient id="cone" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="var(--ice-400)"/><stop offset="1" stop-color="var(--ice-400)" stop-opacity="0"/></linearGradient>
 <radialGradient id="floorR" gradientUnits="userSpaceOnUse" cx="${PED.tux[0]}" cy="${PED.tux[1] + 50}" r="520" gradientTransform="translate(${PED.tux[0]} ${PED.tux[1] + 50}) scale(1.5 .62) translate(-${PED.tux[0]} -${PED.tux[1] + 50})"><stop offset="0" stop-color="#fff"/><stop offset=".45" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
 <mask id="floorM" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="url(#floorR)"/></mask>
 <linearGradient id="rflfade" gradientUnits="userSpaceOnUse" x1="0" y1="${FOOT}" x2="0" y2="${FOOT + 70}"><stop offset="0" stop-color="#fff" stop-opacity=".3"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
 <mask id="rfl" maskUnits="userSpaceOnUse" x="0" y="${FOOT}" width="${W}" height="${H - FOOT}"><rect x="0" y="${FOOT}" width="${W}" height="${H - FOOT}" fill="url(#rflfade)"/></mask>
 <pattern id="scanp" width="4" height="2" patternUnits="userSpaceOnUse"><rect width="4" height="1" fill="#000"/></pattern>
 <g id="tuxface"><g transform="translate(${TX.toFixed(1)},${TY.toFixed(1)}) scale(${TK})">${tuxFace}</g></g>
</defs>

<clipPath id="card"><rect width="${W}" height="${H}" rx="18"/></clipPath>
<g clip-path="url(#card)">
<rect width="${W}" height="${H}" fill="var(--gray-1000)"/>

<!-- floor, traces, glows -->
<g mask="url(#floorM)">
 ${floor()}
</g>
<g filter="url(#tglow)" fill="none" stroke-width="2.5" stroke-linejoin="round">
  <path d="${traces[0]}" stroke="var(--ice-400)" opacity=".45"/><path d="${traces[1]}" stroke="var(--uv-400)" opacity=".45"/><path d="${traces[2]}" stroke="var(--ice-400)" opacity=".45"/>
  <path class="flow" d="${traces[0]}" stroke="var(--ice-400)"/><path class="flow" d="${traces[1]}" stroke="var(--uv-400)"/><path class="flow" d="${traces[2]}" stroke="var(--ice-400)"/>
  ${nodes}
 </g>
<ellipse cx="${PED.tux[0]}" cy="${PED.tux[1] + 6}" rx="230" ry="70" fill="var(--uv-400)" opacity=".14" filter="url(#glow)"/>
<polygon class="cone" opacity=".35" points="${PED.tux[0] - 70},${PED.tux[1]} ${PED.tux[0] + 70},${PED.tux[1]} ${PED.tux[0] + 175},0 ${PED.tux[0] - 175},0" fill="url(#cone)" filter="url(#glow)"/>

<!-- pedestals -->
${pedestal(...PED.tux, SZ, 'linux')}

<!-- Tux: reflection, ghosts, extrusion, acid rim, foil face -->
<ellipse cx="${PED.tux[0]}" cy="${FOOT}" rx="100" ry="20" fill="var(--gray-1000)" opacity=".55" filter="url(#glow)"/>
<g mask="url(#rfl)"><use href="#tuxface" transform="translate(0,${2 * FOOT}) scale(1,-1)"/></g>
<g transform="translate(${TX.toFixed(1)},${TY.toFixed(1)}) scale(${TK})">
 <g class="gh1"><g transform="translate(-4,0)" fill="none" stroke="var(--uv-400)" stroke-width="1.3" opacity=".6">${SIL}</g></g>
 <g class="gh2"><g transform="translate(4,0)" fill="none" stroke="var(--ice-400)" stroke-width="1.3" opacity=".6">${SIL}</g></g>
 ${tuxExt}
 <g mask="url(#rim)" fill="none" stroke="var(--acid-400)" stroke-width="4.5" stroke-linejoin="round"><g filter="url(#rg)" opacity=".85">${SIL}</g>${SIL}</g>
 ${tuxFace}
</g>

<ellipse cx="330" cy="230" rx="300" ry="120" fill="var(--uv-400)" opacity=".05" filter="url(#glow)"/>
<!-- words -->
<g transform="translate(72,0)">
 <rect y="74" width="16" height="16" rx="3" fill="var(--ink)"/>
 <text x="28" y="89" class="mono5" font-size="19" letter-spacing=".08em" fill="var(--ink-muted)">UTP · FISC · 2ND SEMESTER 2026</text>
 <g class="disp" font-size="100">
  <g class="gh1" fill="var(--uv-400)" opacity=".4"><text x="-3" y="196">Operating</text><text x="-3" y="288">Systems.</text></g>
  <g class="gh2" fill="var(--ice-400)" opacity=".4"><text x="3" y="196">Operating</text><text x="3" y="288">Systems.</text></g>
  <g fill="var(--ink)"><text y="196">Operating</text><text y="288">Systems.</text></g>
 </g>
 <text y="334" class="mono7" font-size="19" fill="var(--ink-2)">5 labs · 6 assignments · 1 project</text>
 <text y="362" class="mono5" font-size="17" fill="var(--ink-muted)">processes · scheduling · memory · cgroups · fsync</text>
</g>

<!-- scanlines over everything -->
<rect width="${W}" height="${H}" fill="url(#scanp)" opacity=".1"/>
</g>
</svg>
`;
fs.writeFileSync(path.join(here, '..', 'banner.svg'), svg);
console.log('banner.svg', (svg.length / 1024).toFixed(1), 'KiB');
