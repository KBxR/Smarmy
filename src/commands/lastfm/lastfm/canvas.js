const { SlashCommandSubcommandBuilder, EmbedBuilder } = require('discord.js');
const { getTopAlbums, getLastFmUser } = require('@api/lastFm');
const { DBHandler } = require('@utils');
const { resolveUsername, generateImage } = require('@lastFmUtils');

const MAX_SIZE = 15;
const IMAGE_SIZE = 250;
const PERIODS = {
    '7day': 'Weekly',
    '1month': 'Monthly',
    '3month': 'Quarterly',
    '6month': 'Half Yearly',
    '12month': 'Yearly',
    'overall': 'All Time'
};

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

module.exports.execute = async function handleCanvas(interaction) {
    await interaction.deferReply({ ephemeral: false });

    let username = interaction.options.getString('username');
    const mention = interaction.options.getUser('member');
    const sizeInput = parseInt(interaction.options.getString('size'), 10);
    const period = interaction.options.getString('period') || '7day';
    const userID = interaction.user.id;

    if (isNaN(sizeInput) || sizeInput <= 0 || sizeInput > MAX_SIZE) {
        return interaction.editReply({ content: 'Size must be a positive number and less than or equal to 15.', ephemeral: true });
    }

    const tracksHorizontal = sizeInput;
    const canvasSize = tracksHorizontal * IMAGE_SIZE;
    const result = await resolveUsername({ username, mention, userID, interaction, DBHandler });

    if (result.error) {
        return interaction.reply({ content: result.error, ephemeral: true });
    }
    
    username = result.username;

    try {
        const resUser = await getLastFmUser(username);
        if (!resUser) {
            return interaction.reply({ content: 'The Last.fm username does not exist.', ephemeral: true });
        }

        const totalTracks = tracksHorizontal * tracksHorizontal;
        const tracks = await getTopAlbums(username, totalTracks, period);

        if (tracks.length < totalTracks) {
            return interaction.editReply({ content: `Not enough results to create a full canvas. Only found ${tracks.length} tracks.`, ephemeral: true });
        }

        const attachment = await generateImage(tracks, canvasSize, tracksHorizontal);

        const canvasEmbed = new EmbedBuilder()
            .setColor('#e4141e')
            .setAuthor({ name: `${username}`, iconURL: `${resUser.image[0]['#text']}`, url: `${resUser.url}` })
            .setTitle(`${username}'s ${PERIODS[period]} Top Albums`)
            .setFooter({ text: `Total Scrobbles: ${resUser.playcount}`, iconURL: 'https://www.last.fm/static/images/lastfm_avatar_twitter.52a5d69a85ac.png' });

        await interaction.editReply({ embeds: [canvasEmbed], files: [{ attachment, name: 'imageSquare.png' }] });

    } catch (error) {
        console.error('Error processing canvas:', error);
        await interaction.editReply({ content: 'An error occurred while processing the image. Please try again later.', ephemeral: true });
    }
};
