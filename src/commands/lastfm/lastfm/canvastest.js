const { SlashCommandSubcommandBuilder } = require('discord.js');
const DBHandler = require('@utils/DBHandler');
const { createCanvas, loadImage } = require('canvas');
const { getRecentTracks } = require('@api/lastFm');
const resolveUsername = require('../utils/usernameResolver');

module.exports.data = new SlashCommandSubcommandBuilder()
    .setName('canvastest')
    .setDescription('Combines album covers of recent tracks into a square')
    .addStringOption(option =>
        option.setName('size')
            .setDescription('Size of the square (Must be bellows 5)')
            .setRequired(true))
    .addStringOption(option =>
        option.setName('username')
            .setDescription('Last.fm username'))
    .addUserOption(option =>
        option.setName('member')
            .setDescription('User in server to check'));

function calculateAverageBrightness(img) {
    const canvasTemp = createCanvas(img.width, img.height);
    const ctxTemp = canvasTemp.getContext('2d');
    ctxTemp.drawImage(img, 0, 0);
    const imageData = ctxTemp.getImageData(0, 0, img.width, img.height);
    const data = imageData.data;
    let r, g, b, avg;
    let colorSum = 0;

    for (let x = 0, len = data.length; x < len; x += 4) {
        r = data[x];
        g = data[x + 1];
        b = data[x + 2];

        avg = Math.floor((r + g + b) / 3);
        colorSum += avg;
    }

    const brightness = Math.floor(colorSum / (img.width * img.height));
    return brightness;
}

// Function to choose background color based on brightness
function chooseBackgroundColor(brightness) {
    // If brightness is more than 128 (out of 255), image is considered bright, use black; otherwise, use white
    return brightness > 128 ? 'black' : 'white';
}

module.exports.execute = async function(interaction) {
    const usernameInput = interaction.options.getString('username');
    const mention = interaction.options.getUser('member');
    const sizeInput = interaction.options.getString('size');
    const userID = interaction.user.id;

    if (sizeInput > 4) {
        return interaction.reply({ content: 'Size must be less than or equal to 4.', ephemeral: true });
    }

    const tracksHorizontal = parseInt(sizeInput, 10);
    if (isNaN(tracksHorizontal) || tracksHorizontal <= 0) {
        await interaction.reply({ content: 'Invalid size provided. Size must be a positive number.', ephemeral: true });
        return;
    }

    const canvasSize = tracksHorizontal * 250; // Calculate canvas size based on number of tracks horizontally

    const { username, error } = await resolveUsername({ username: usernameInput, mention, userID, interaction, DBHandler });
    if (error) {
        await interaction.reply({ content: error, ephemeral: true });
        return;
    }

    try {
        const imageSize = 250; // Consider reducing this if memory issues persist
        const totalTracks = tracksHorizontal * tracksHorizontal;

        const tracks = await getRecentTracks(username, totalTracks);
        const canvas = createCanvas(canvasSize, canvasSize);
        const ctx = canvas.getContext('2d');

        for (let i = 0; i < tracks.length; i++) {
            const track = tracks[i];
            const imageUrl = track.image[2]['#text'];
            const artistName = track.artist['#text'];
            const songName = track.name;
        
            try {
                const img = await loadImage(imageUrl);
                const x = (i % tracksHorizontal) * imageSize;
                const y = Math.floor(i / tracksHorizontal) * imageSize;
                const padding = 10;
                ctx.drawImage(img, x, y, imageSize, imageSize);
            
                // Calculate average brightness of the image
                const brightness = calculateAverageBrightness(img);
                // Choose background color based on brightness
                const backgroundColor = chooseBackgroundColor(brightness);
            
                // Set text style
                ctx.font = '20px Arial';
                ctx.textAlign = 'center';
            
                // Calculate text positions
                const textX = x + imageSize / 2;
                const artistTextY = y + imageSize - 30; // Position for artist name
                const songTextY = y + imageSize - 5; // Position for song name
            
                // Measure text for background size calculation
                const artistMetrics = ctx.measureText(artistName);
                const songMetrics = ctx.measureText(songName);
                const maxTextWidth = Math.max(artistMetrics.width, songMetrics.width) + padding;
            
                // Draw background rectangle for text with dynamic color
                ctx.fillStyle = backgroundColor === 'black' ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.6)';
                ctx.fillRect(textX - (maxTextWidth / 2), artistTextY - 20, maxTextWidth, 50); // Adjust height to cover both lines
            
                // Adjust text color based on background color for better readability
                ctx.fillStyle = backgroundColor === 'black' ? 'white' : 'black';
            
                // Draw artist name
                ctx.fillText(artistName, textX, artistTextY, imageSize - 10);
            
                // Draw song name
                ctx.fillText(songName, textX, songTextY, imageSize - 10);
            } catch (imgError) {
                console.error('Error loading image:', imgError);
            }
        }

        const attachment = canvas.toBuffer();
        await interaction.reply({ files: [{ attachment, name: 'imageSquare.png' }] });
    } catch (error) {
        console.error('Error creating image square:', error);
        await interaction.reply({ content: 'An error occurred while creating the image square. Please try again later.', ephemeral: true });
    }
};