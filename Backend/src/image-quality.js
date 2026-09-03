const sharp = require("sharp");

async function checkImageQuality(file) {
  const image = sharp(file.buffer);

  const metadata = await image.metadata();
  const stats = await image.clone().greyscale().stats();

  const width = metadata.width;
  const height = metadata.height;

  // -----------------------------
  // 1. Resolution check
  // -----------------------------
  const minWidth = 1000;
  const minHeight = 1000;

  const resolutionGood =
    width >= minWidth && height >= minHeight;

  // -----------------------------
  // 2. Brightness check
  // -----------------------------
  // Mean pixel value: 0 = black, 255 = white
  const brightness = stats.channels[0].mean;

  const minBrightness = 50;
  const maxBrightness = 210;

  const brightnessGood =
    brightness >= minBrightness &&
    brightness <= maxBrightness;

  // -----------------------------
  // 3. Blur check
  // -----------------------------
  const { data, info } = await image
    .clone()
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let laplacianSum = 0;
  let laplacianSquaredSum = 0;
  let count = 0;

  // Laplacian kernel:
  //
  //  0  1  0
  //  1 -4  1
  //  0  1  0

  for (let y = 1; y < info.height - 1; y++) {
    for (let x = 1; x < info.width - 1; x++) {
      const center = y * info.width + x;

      const top = data[(y - 1) * info.width + x];
      const bottom = data[(y + 1) * info.width + x];
      const left = data[y * info.width + (x - 1)];
      const right = data[y * info.width + (x + 1)];
      const middle = data[center];

      const laplacian =
        top +
        bottom +
        left +
        right -
        4 * middle;

      laplacianSum += laplacian;
      laplacianSquaredSum += laplacian * laplacian;

      count++;
    }
  }

  const laplacianMean = laplacianSum / count;

  const blurScore =
    laplacianSquaredSum / count -
    laplacianMean * laplacianMean;

  const minBlurScore = 100;

  const blurGood = blurScore >= minBlurScore;

  // -----------------------------
  // Overall result
  // -----------------------------
  const qualityGood =
    resolutionGood &&
    brightnessGood &&
    blurGood;

  return {
    success: true,

    quality: qualityGood ? "good" : "poor",

    checks: {
      resolution: resolutionGood,
      brightness: brightnessGood,
      blur: blurGood
    },

    scores: {
      brightness: Number(brightness.toFixed(2)),
      blur: Number(blurScore.toFixed(2))
    },

    image: {
      width,
      height,
      format: metadata.format,
      size: file.size
    }
  };
}

module.exports = {
  checkImageQuality
};