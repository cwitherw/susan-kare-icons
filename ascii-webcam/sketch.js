const DENSITIES = [
  [26, 0.1463], [42, 0.1468], [32, 0.1577], [24, 0.1669], [10, 0.1759], [5, 0.1849],
  [39, 0.1885], [20, 0.1917], [48, 0.1932], [34, 0.1955], [47, 0.1968], [18, 0.1987],
  [40, 0.2038], [33, 0.2041], [6, 0.2043], [23, 0.2137], [3, 0.2272], [46, 0.2273],
  [2, 0.2279], [28, 0.2288], [12, 0.2305], [9, 0.2336], [29, 0.2373], [35, 0.2493],
  [30, 0.2511], [7, 0.2535], [4, 0.2593], [44, 0.2599], [21, 0.2606], [36, 0.2626],
  [22, 0.2649], [43, 0.2663], [31, 0.2688], [45, 0.2762], [14, 0.2846], [38, 0.287],
  [1, 0.2938], [37, 0.2993], [25, 0.3083], [15, 0.3184], [41, 0.3401], [19, 0.344],
  [13, 0.3653], [27, 0.3777], [8, 0.401], [17, 0.4069], [16, 0.4426], [11, 0.4619],
];
const SIMILARITY = 0.03;
const SIMILAR = DENSITIES.map(([, d]) =>
  DENSITIES.map((_, k) => k).filter((k) => Math.abs(DENSITIES[k][1] - d) <= SIMILARITY)
);
const ICON_SIZE = 11;
const STEP = 9;
const LIGHT_MIN = 0.2 * 255;
const LIGHT_MAX = 0.8 * 255;
const DARK_MAX = 0.4 * 255;
const WHITE_MIN = 0.9 * 255;
const CONTRAST = 2;

let video;
let iconsBlack = [];
let iconsWhite = [];

function preload() {
  for (const [n] of DENSITIES) {
    iconsBlack.push(loadImage(`../icons/icon_${String(n).padStart(2, "0")}.png`));
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  background(255);
  noStroke();
  for (const icon of iconsBlack) iconsWhite.push(whiten(icon));
  for (const icon of iconsBlack) icon.resize(ICON_SIZE, ICON_SIZE);
  for (const icon of iconsWhite) icon.resize(ICON_SIZE, ICON_SIZE);
  video = createCapture(VIDEO);
  video.size(floor(width / STEP), floor(height / STEP));
  video.hide();
}

function whiten(img) {
  const copy = img.get();
  copy.loadPixels();
  const n = 4 * copy.width * copy.pixelDensity() * copy.height * copy.pixelDensity();
  for (let i = 0; i < n; i += 4) {
    copy.pixels[i] = 255;
    copy.pixels[i + 1] = 255;
    copy.pixels[i + 2] = 255;
  }
  copy.updatePixels();
  return copy;
}

function pickIcon(set, idx, i, j) {
  const group = SIMILAR[constrain(idx, 0, SIMILAR.length - 1)];
  if (group.length === 1) return set[idx];
  const h = ((i + 1) * 73856093 ^ (j + 1) * 19349663) >>> 0;
  return set[group[h % group.length]];
}

function draw() {
  background(255);
  video.loadPixels();
  if (video.pixels.length === 0) return;
  fill(0);
  for (let j = 0; j < video.height; j++) {
    for (let i = 0; i < video.width; i++) {
      const k = (j * video.width + i) * 4;
      const raw = (video.pixels[k] + video.pixels[k + 1] + video.pixels[k + 2]) / 3;
      if (raw < DARK_MAX) rect(i * STEP, j * STEP, STEP, STEP);
    }
  }
  for (let j = 0; j < video.height; j++) {
    for (let i = 0; i < video.width; i++) {
      const k = (j * video.width + i) * 4;
      const raw = (video.pixels[k] + video.pixels[k + 1] + video.pixels[k + 2]) / 3;
      if (raw < LIGHT_MIN) continue;
      if (raw > WHITE_MIN) continue;
      const bright = constrain((raw / 255 - 0.5) * CONTRAST + 0.5, 0, 1) * 255;
      const t = floor(map(bright, 0, 255, iconsBlack.length, 0));
      const set = raw < DARK_MAX ? iconsWhite : iconsBlack;
      image(pickIcon(set, t, i, j), i * STEP, j * STEP, ICON_SIZE, ICON_SIZE);
      if (raw > LIGHT_MAX) {
        image(pickIcon(set, t + 1, i, j + 97), i * STEP, j * STEP, ICON_SIZE, ICON_SIZE);
      }
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  video.size(floor(width / STEP), floor(height / STEP));
}
