const { createCanvas, loadImage } = require('canvas');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function pixelateImage(imageUrl, scale) {
    const response = await fetch(imageUrl);
    const buffer = Buffer.from(await response.arrayBuffer());
    const originalImage = await loadImage(buffer);
    const pixelatedWidth = originalImage.width * scale;
    const pixelatedHeight = originalImage.height * scale;

    const canvas = createCanvas(pixelatedWidth, pixelatedHeight);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(originalImage, 0, 0, pixelatedWidth, pixelatedHeight);

    const finalCanvas = createCanvas(originalImage.width, originalImage.height);
    const finalCtx = finalCanvas.getContext('2d');
    finalCtx.imageSmoothingEnabled = false;
    finalCtx.drawImage(canvas, 0, 0, originalImage.width, originalImage.height);

    return finalCanvas.toBuffer();
}

module.exports = pixelateImage;