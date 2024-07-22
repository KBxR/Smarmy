const { createCanvas, loadImage } = require('canvas');

const IMAGE_SIZE = 250;

const DEFAULT_IMAGE_URL = "https://lastfm.freetls.fastly.net/i/u/300x300/c6f59c1e5e7240a4c0d427abd71f3dbb.jpg";
const FONT_SIZES = { small: '12px', medium: '14px', large: '17px' };

const calculateAverageBrightness = (img) => {
    const canvasTemp = createCanvas(img.width, img.height);
    const ctxTemp = canvasTemp.getContext('2d');
    ctxTemp.drawImage(img, 0, 0);
    const imageData = ctxTemp.getImageData(0, 0, img.width, img.height);
    const data = imageData.data;
    let colorSum = 0;

    for (let x = 0, len = data.length; x < len; x += 4) {
        const avg = (data[x] + data[x + 1] + data[x + 2]) / 3;
        colorSum += avg;
    }

    return Math.floor(colorSum / (img.width * img.height));
};

const chooseBackgroundColor = (brightness) => (brightness > 128 ? 'white' : 'black');

const getFontSize = (text) => {
    if (text.length <= 20) return FONT_SIZES.large;
    if (text.length <= 30) return FONT_SIZES.medium;
    return FONT_SIZES.small;
};

const loadImageSafely = async (url) => {
    try {
        return await loadImage(url);
    } catch (error) {
        console.error('Error loading image:', error);
        return await loadImage(DEFAULT_IMAGE_URL);
    }
};

const generateImage = async (tracks, canvasSize, tracksHorizontal) => {
    const canvas = createCanvas(canvasSize, canvasSize);
    const ctx = canvas.getContext('2d');
    ctx.font = '15px Lato';
    ctx.textAlign = 'center';

    const images = await Promise.all(tracks.map(track => {
        const imageUrl = track.image[2]['#text'] || DEFAULT_IMAGE_URL;
        return loadImageSafely(imageUrl);
    }));

    tracks.forEach((track, i) => {
        const img = images[i];
        if (!img) return;

        const x = (i % tracksHorizontal) * IMAGE_SIZE;
        const y = Math.floor(i / tracksHorizontal) * IMAGE_SIZE;
        ctx.drawImage(img, x, y, IMAGE_SIZE, IMAGE_SIZE);

        const artistText = track.artist.name;
        const songText = track.name;

        const maxTextWidth = Math.min(Math.max(
            ctx.measureText(artistText).width + 10,
            ctx.measureText(songText).width + 10
        ), IMAGE_SIZE - 20);

        const textX = x + IMAGE_SIZE / 2;
        const artistTextY = y + IMAGE_SIZE - 30;
        const songTextY = y + IMAGE_SIZE - 5;

        const brightness = calculateAverageBrightness(img);
        const backgroundColor = chooseBackgroundColor(brightness);
        ctx.fillStyle = backgroundColor === 'black' ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.6)';
        ctx.fillRect(textX - (maxTextWidth / 2), artistTextY - 20, maxTextWidth, 50);

        ctx.fillStyle = backgroundColor === 'black' ? 'white' : 'black';
        ctx.font = getFontSize(artistText);
        ctx.fillText(artistText, textX, artistTextY, IMAGE_SIZE - 20);
        ctx.font = getFontSize(songText);
        ctx.fillText(songText, textX, songTextY, IMAGE_SIZE - 20);
    });

    return canvas.toBuffer();
};

module.exports = generateImage;