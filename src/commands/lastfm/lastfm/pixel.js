const { SlashCommandSubcommandBuilder, EmbedBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('canvas');
const { getTopAlbums, getLastFmUser } = require('@api/lastFm');
const { resolveUsername, DBHandler } = require('@utils');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

module.exports.data = new SlashCommandSubcommandBuilder()
    .setName('pixel')
    .setDescription('Gets your top 50 albums and picks one at random for you to guess')
    .addStringOption(option =>
        option.setName('username')
            .setDescription('Last.fm username'))
    .addUserOption(option =>
        option.setName('member')
            .setDescription('User in server to use'));

function shuffleWord(word) {
    const characters = word.split('');
    for (let i = characters.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [characters[i], characters[j]] = [characters[j], characters[i]]; // Swap characters
    }
    return characters.join('');
}

function jumbleAlbumName(albumName) {
    return albumName.split(' ').map(shuffleWord).join(' ');
}

module.exports.execute = async function handleCanvas(interaction) {
    await interaction.deferReply({ ephemeral: false });
    let username = interaction.options.getString('username');
    let mention = interaction.options.getUser('member');
    let userID = interaction.user.id;
    let gameInProgress = false;
    
    if (gameInProgress) {
        await interaction.reply({content: "A game is already in progress. Please wait for it to finish before starting a new one." , ephemeral: true});
        return; // Prevent starting a new game
    }

    const result = await resolveUsername({ username, mention, userID, interaction, DBHandler });
    if (result.error) {
        return interaction.reply({ content: result.error, ephemeral: true });
    }
    username = result.username;

    // Check if the Last.fm user exists
    const resUser = await getLastFmUser(username);
    if (!resUser) {
        return interaction.reply({ content: 'The Last.fm username does not exist.', ephemeral: true });
    }

    try {
        const albums = await getTopAlbums(username, 75);
        if (!albums || albums.length === 0) {
            return interaction.reply({ content: 'No albums found for this user.', ephemeral: true });
        }
    
        const randomAlbum = albums[Math.floor(Math.random() * albums.length)];
        const imageUrl = randomAlbum.image[3]['#text'];
        const response = await fetch(imageUrl);
        const buffer = Buffer.from(await response.arrayBuffer());
        const originalImage = await loadImage(buffer);
        const scale = 0.1; // Scale factor for pixelation
        const pixelatedWidth = originalImage.width * scale;
        const pixelatedHeight = originalImage.height * scale;
    
        const canvas = createCanvas(pixelatedWidth, pixelatedHeight);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(originalImage, 0, 0, pixelatedWidth, pixelatedHeight);
    
        const finalCanvas = createCanvas(originalImage.width, originalImage.height);
        const finalCtx = finalCanvas.getContext('2d');
        finalCtx.imageSmoothingEnabled = false;
        finalCtx.drawImage(canvas, 0, 0, originalImage.width, originalImage.height);
    
        const attachment = finalCanvas.toBuffer();

        // make an embed with the image and a jumbled up album name
        const albumName = randomAlbum.name;
        const jumbledName = jumbleAlbumName(albumName);
        const embed = new EmbedBuilder()
            .setColor('#e4141e')
            .setTitle('Guess the Album')
            .setDescription(`Guess the album from the pixelated image below. The album name has been jumbled up: \`${jumbledName}\``);
    
        await interaction.editReply({
            files: [attachment],
            embeds: [embed],
            ephemeral: false
        });

        const filter = m => m.author.id === interaction.user.id;
        const collector = interaction.channel.createMessageCollector({ filter, time: 60000 }); // Adjust time as needed

        gameInProgress = true;

        collector.on('collect', async m => {
// After sending the initial embed with the pixelated image
const sentMessage = await interaction.editReply({
    files: [attachment], // This is the pixelated image
    embeds: [embed],
    ephemeral: false
});

// Inside the collector.on('collect', ...) for a correct guess
if (m.content.toLowerCase() === albumName.toLowerCase()) {
    // Assuming you have a way to get the unpixelated image URL or buffer
    const imageUrl = randomAlbum.image[3]['#text'];

    const completedEmbed = new EmbedBuilder()
        .setColor('#ffd700') // Gold color
        .setTitle('Guess the Album - Completed!')
        .setDescription(`Congratulations! You guessed the album correctly: **${albumName}**`)

    // Edit the original message with the new embed and unpixelated image
    await sentMessage.edit({
        files: [imageUrl],
        embeds: [completedEmbed]
    });

    await m.reply(`Congratulations! You guessed the album correctly: **${albumName}**`);
    gameInProgress = false;
    collector.stop(); // Stop collecting further messages
} else {
    // Incorrect guess logic remains the same
    await m.reply(`That's not correct, try again!`);
}
        });

        collector.on('end', collected => {
            // This will run when the collector stops, either due to time running out or a correct guess
            if (collected.size === 0) {
                interaction.followUp(`Time's up! The correct album was **${albumName}**.`);

                const imageUrl = randomAlbum.image[3]['#text'];
                const failedEmbed = new EmbedBuilder()
                    .setColor('#ffd700')
                    .setTitle('Guess the Album - Failed!')
                    .setDescription(`The album was **${albumName}**`)

                sentMessage.edit({
                    files: [imageUrl],
                    embeds: [failedEmbed]
                });
                gameInProgress = false;
            }
        });

    } catch (error) {
        console.error('Error processing pixel:', error);
        await interaction.editReply({ content: 'An error occurred while processing the image. Please try again later.', ephemeral: true });
    }
};