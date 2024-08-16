const { AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage, registerFont } = require('canvas');

// Register the font
const fontPath = path.join(__dirname, 'Impact.ttf');
registerFont(fontPath, { family: 'Impact' });

const PICTURE_URL = "https://cdn.discordapp.com/attachments/1273979538505859253/1273980702211444847/Don_Cheadle.jpg?ex=66c0967c&is=66bf44fc&hm=8734e7a1cb9880d0ff09b01c48a516eb469595729744adcc99beb06357fd69d2&";

async function sendWOTD(client, channelId) {
    if (!client) {
        console.error('Client is not defined');
        return;
    }

    try {
        const fetch = (await import('node-fetch')).default;
        const response = await fetch(PICTURE_URL);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const image = await loadImage(buffer);

        const canvas = createCanvas(image.width, image.height);
        const ctx = canvas.getContext('2d');

        // Draw the image
        ctx.drawImage(image, 0, 0, image.width, image.height);

        // Set the font and add text with shadow
        ctx.font = '90px Impact'; // Reduced font size to fit the text
        ctx.fillStyle = 'white';
        ctx.shadowColor = 'rgba(0, 0, 0, 1)'; // Darker shadow
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 0; // Shadow directly behind the text
        ctx.shadowOffsetY = 0; // Shadow directly behind the text
        ctx.textAlign = 'center';

        // Set the outline color and width
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 5;

        // First line of text with outline
        ctx.strokeText('DON CHEADLE', canvas.width / 2, 100); // Adjusted y-coordinate
        ctx.fillText('DON CHEADLE', canvas.width / 2, 100); // Adjusted y-coordinate

        // Second line of text with outline
        ctx.strokeText('WORD OF THE DAY', canvas.width / 2, 200); // Adjusted y-coordinate
        ctx.fillText('WORD OF THE DAY', canvas.width / 2, 200); // Adjusted y-coordinate

        // Fetch a random word
        const wordResponse = await fetch('https://random-word-api.herokuapp.com/word?number=1');
        const wordArray = await wordResponse.json();
        const randomWord = wordArray[0].toUpperCase();

        // Third line of text with the random word at the bottom
        ctx.strokeText(randomWord, canvas.width / 2, canvas.height - 50); // Adjusted y-coordinate to bottom
        ctx.fillText(randomWord, canvas.width / 2, canvas.height - 50); // Adjusted y-coordinate to bottom

        // Convert the canvas to a buffer
        const editedImageBuffer = canvas.toBuffer();

        // Create an attachment
        const attachment = new AttachmentBuilder(editedImageBuffer, { name: 'edited-image.png' });

        // Fetch the channel and send the image
        const channel = await client.channels.fetch(channelId);
        if (channel) {
            await channel.send({ files: [attachment] });
            console.log('Picture sent!');
        } else {
            console.error('Channel not found!');
        }
    } catch (error) {
        console.error('Error fetching or processing the image:', error);
    }
}
module.exports = {
    sendWOTD
};