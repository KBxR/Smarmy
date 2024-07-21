const { SlashCommandSubcommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { getTopAlbums, getLastFmUser } = require('@api/lastFm');
const { DBHandler } = require('@utils');
const { resolveUsername, pixelateImage, buttonCollector, messageCollector } = require('@lastFmUtils');

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
        const albumName = randomAlbum.name;
        const artistName = randomAlbum.artist.name;
        const jumbledName = jumbleAlbumName(albumName);
        const imageUrl = randomAlbum.image[3]['#text'];
        let scale = 0.1; // Scale factor for pixelation
        pixelateImage(imageUrl, scale).then(attachment => {

            // Start the collectors
            messageCollector(interaction, albumName, imageUrl, randomAlbum);
            buttonCollector(interaction, imageUrl, jumbledName, artistName);

            const embed = new EmbedBuilder()
                .setColor('#b3b3b3')
                .setTitle('Guess the Album')
                .setDescription(`Guess the album from the pixelated image below. The album name has been jumbled up: \`${jumbledName}\``);
        
            const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('hint')
                    .setLabel('❕ Hint ❕')
                    .setStyle(ButtonStyle.Primary),
            );

            // Use the pixelated image attachment in your reply or editReply method
            interaction.editReply({
                files: [attachment],
                embeds: [embed],
                components: [row],
                ephemeral: false
            });

        })

    } catch (error) {
        console.error('Error processing pixel:', error);
        await interaction.editReply({ content: 'An error occurred while processing the image. Please try again later.', ephemeral: true });
    }
};