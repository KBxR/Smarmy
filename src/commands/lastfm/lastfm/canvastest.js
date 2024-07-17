const { SlashCommandSubcommandBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('canvas');
const { getRecentTracks } = require('@api/lastFm');
const { resolveUsername, DBHandler } = require('@utils');

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
        ctx.font = '15px Lato'; // Set font once
        ctx.textAlign = 'center'; // Set text alignment once
        
        // Preload images
        const images = await Promise.all(tracks.map(track => loadImage(track.image[2]['#text']).catch(err => console.error('Error loading image:', err))));
        
        // Cache for text measurements to avoid recalculating
        const textMeasurements = {};
    
        tracks.forEach((track, i) => {
            const img = images[i]; // Use preloaded image
            if (!img) return; // Skip if image failed to load
        
            const x = (i % tracksHorizontal) * imageSize;
            const y = Math.floor(i / tracksHorizontal) * imageSize;
            ctx.drawImage(img, x, y, imageSize, imageSize);
        
            const textKey = `${track.artist['#text']}-${track.name}`;
            if (!textMeasurements[textKey]) {
                const padding = 10;
                const artistTextWidth = ctx.measureText(track.artist['#text']).width + padding;
                const songTextWidth = ctx.measureText(track.name).width + padding;
                const maxTextWidth = Math.max(artistTextWidth, songTextWidth);
                textMeasurements[textKey] = { artistTextWidth, songTextWidth, maxTextWidth };
            }
        
            const textX = x + imageSize / 2;
            const artistTextY = y + imageSize - 30;
            const songTextY = y + imageSize - 5;
            const backgroundX = textX - (maxTextWidth / 2);
            const backgroundWidth = maxTextWidth;
        
            // Grouped drawing operations
            const brightness = calculateAverageBrightness(img);
            const backgroundColor = chooseBackgroundColor(brightness);
            ctx.fillStyle = backgroundColor === 'black' ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.6)';
            ctx.fillRect(backgroundX, artistTextY - 20, backgroundWidth, 50);
        
            ctx.fillStyle = backgroundColor === 'black' ? 'white' : 'black';
            ctx.fillText(track.artist['#text'], textX, artistTextY, imageSize - 10);
            ctx.fillText(track.name, textX, songTextY, imageSize - 10);
        });

        const attachment = canvas.toBuffer();

        const canvasEmbed = new EmbedBuilder()
            .setColor('#e4141e')
            .setTitle(title)
            .setAuthor({ name: `${username}`, iconURL: `${resUser.image[0]['#text']}`, url: `${resUser.url}` })
            .setFooter({ text: `Total Scrobbles: ${resUser.playcount}`, iconURL: 'https://www.last.fm/static/images/lastfm_avatar_twitter.52a5d69a85ac.png' });

        await interaction.reply({ embeds: [canvasEmbed], files: [{ attachment, name: 'imageSquare.png' }] });
    } catch (error) {
        console.error('Error creating image square:', error);
        await interaction.reply({ content: 'An error occurred while creating the image square. Please try again later.', ephemeral: true });
    }
};