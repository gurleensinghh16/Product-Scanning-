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
    width >= minWidth &&
    height >= minHeight;

  // -----------------------------
  // 2. Brightness check
  // -----------------------------

  // Mean pixel value:
  // 0 = black
  // 255 = white

  const brightness = stats.channels[0].mean;

  const minBrightness = 50;
  const maxBrightness = 210;

  const brightnessGood =
    brightness >= minBrightness &&
    brightness <= maxBrightness;

  // -----------------------------
  // Overall image quality
  // -----------------------------

  const qualityGood =
    resolutionGood &&
    brightnessGood;

  return {
    success: true,

    quality: qualityGood ? "good" : "poor",

    checks: {
      resolution: resolutionGood,
      brightness: brightnessGood
    },

    scores: {
      brightness: Number(brightness.toFixed(2))
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