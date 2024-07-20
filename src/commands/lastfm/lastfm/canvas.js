const { SlashCommandSubcommandBuilder, EmbedBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('canvas');
const { getTopAlbums, getLastFmUser } = require('@api/lastFm');
const { resolveUsername, DBHandler } = require('@utils');

module.exports.data = new SlashCommandSubcommandBuilder()
    .setName('canvas')
    .setDescription('Generates a square image of the user\'s top albums')
    .addStringOption(option =>
        option.setName('size')
            .setDescription('Size of the square (Max 15)')
            .setRequired(true))
    .addStringOption(option =>
        option.setName('period')
            .setDescription('Time period for recent tracks (Defaults to Weekly)')
            .addChoices(
                { name: 'Weekly', value: '7day' },
                { name: 'Monthly', value: '1month' },
                { name: 'Quarterly', value: '3month' },
                { name: 'Half Yearly', value: '6month' },
                { name: 'Yearly', value: '12month' },
                { name: 'All Time', value: 'overall' }
            ))
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
    return brightness > 128 ? 'white' : 'black';
}

// Function to determine font size based on character count
function getFontSize(text) {
    if (text.length <= 20) return '17px'; // Larger font for short text
    if (text.length <= 30) return '14px'; // Medium font for medium text
    return '12px'; // Smaller font for long text
}

module.exports.execute = async function handleCanvas(interaction) {
    await interaction.deferReply({ ephemeral: false });
    const defaultImageUrl = "https://lastfm.freetls.fastly.net/i/u/300x300/c6f59c1e5e7240a4c0d427abd71f3dbb.jpg";

    let username = interaction.options.getString('username');
    let mention = interaction.options.getUser('member');
    const sizeInput = interaction.options.getString('size');
    let period = interaction.options.getString('period') || '7day';
    let userID = interaction.user.id;

    switch (period) {
        case '7day':
            periodText = 'Weekly';
            break;
        case '1month':
            periodText = 'Monthly';
            break;
        case '3month':
            periodText = 'Quarterly';
            break;
        case '6month':
            periodText = 'Half Yearly';
            break;
        case '12month':
            periodText = 'Yearly';
            break;
        case 'overall':
            periodText = 'All Time';
            break;
    }

    if (sizeInput > 15) {
        return interaction.editReply({ content: 'Size must be less than or equal to 15.', ephemeral: true });
    }

    const tracksHorizontal = parseInt(sizeInput, 10);
    if (isNaN(tracksHorizontal) || tracksHorizontal <= 0) {
        await interaction.editReply({ content: 'Invalid size provided. Size must be a positive number.', ephemeral: true });
        return;
    }

    // Size of each album cover image
    const canvasSize = tracksHorizontal * 250;

    const result = await resolveUsername({ username, mention, userID, interaction, DBHandler });
    if (result.error) {
        return interaction.reply({ content: result.error, ephemeral: true });
    }
    username = result.username;
    
    try {

        // Check if the Last.fm user exists
        const resUser = await getLastFmUser(username);
        if (!resUser) {
            return interaction.reply({ content: 'The Last.fm username does not exist.', ephemeral: true });
        }

        const imageSize = 250;
        const totalTracks = tracksHorizontal * tracksHorizontal;

        const tracks = await getTopAlbums(username, totalTracks, period);
        
        // Check if there are enough results to create a full canvas
        if (tracks.length < totalTracks) {
            return interaction.editReply({ content: `Not enough results to create a full canvas. Only found ${tracks.length} tracks.`, ephemeral: true });
        }
        
        const canvas = createCanvas(canvasSize, canvasSize);
        const ctx = canvas.getContext('2d');
        ctx.font = '15px Lato';
        ctx.textAlign = 'center';
        
        // Preload images
        const images = await Promise.all(tracks.map(track => {
            const imageUrl = track.image[2]['#text'] || defaultImageUrl; // Use default image if track image is missing
            return loadImage(imageUrl).catch(err => console.error('Error loading image:', err));
        }));
        
        // Cache for text measurements to avoid recalculating
        const textMeasurements = {};
        
        tracks.forEach((track, i) => {
            const img = images[i];
            if (!img) return;
        
            const x = (i % tracksHorizontal) * imageSize;
            const y = Math.floor(i / tracksHorizontal) * imageSize;
            ctx.drawImage(img, x, y, imageSize, imageSize);
        
            const artistText = track.artist.name;
            const songText = track.name;
            const textKey = `${artistText}-${songText}`;
            if (!textMeasurements[textKey]) {
                // Adjust font size dynamically based on text length
                ctx.font = getFontSize(artistText);
                const artistTextWidth = ctx.measureText(artistText).width + 10;
                ctx.font = getFontSize(songText);
                const songTextWidth = ctx.measureText(songText).width + 10;
                const maxTextWidth = Math.min(Math.max(artistTextWidth, songTextWidth), imageSize - 20);
                textMeasurements[textKey] = { artistTextWidth, songTextWidth, maxTextWidth };
            }
        
            const { maxTextWidth } = textMeasurements[textKey];
        
            const textX = x + imageSize / 2;
            const artistTextY = y + imageSize - 30;
            const songTextY = y + imageSize - 5;
            const backgroundX = textX - (maxTextWidth / 2);
            const backgroundWidth = maxTextWidth;
        
            // Draw background
            const brightness = calculateAverageBrightness(img);
            const backgroundColor = chooseBackgroundColor(brightness);
            ctx.fillStyle = backgroundColor === 'black' ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.6)';
            ctx.fillRect(backgroundX, artistTextY - 20, backgroundWidth, 50);
        
            // Draw artist text with dynamic font size
            ctx.font = getFontSize(artistText);
            ctx.fillStyle = backgroundColor === 'black' ? 'white' : 'black';
            ctx.fillText(artistText, textX, artistTextY, imageSize - 20);
        
            // Draw song text with dynamic font size
            ctx.font = getFontSize(songText);
            ctx.fillText(songText, textX, songTextY, imageSize - 20);
        });

        const attachment = canvas.toBuffer();

        const canvasEmbed = new EmbedBuilder()
        .setColor('#e4141e')
        .setAuthor({ name: `${username}`, iconURL: `${resUser.image[0]['#text']}`, url: `${resUser.url}` })
        .setTitle(`${username}'s ${periodText} Top Albums`)
        .setFooter({ text: `Total Scrobbles: ${resUser.playcount}`, iconURL: 'https://www.last.fm/static/images/lastfm_avatar_twitter.52a5d69a85ac.png' });

    await interaction.editReply({ embeds: [canvasEmbed], files: [{ attachment, name: 'imageSquare.png' }] });

    } catch (error) {
        console.error('Error processing canvas:', error);
        await interaction.editReply({ content: 'An error occurred while processing the image. Please try again later.', ephemeral: true });
    }
};