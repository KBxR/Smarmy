const { SlashCommandSubcommandBuilder, EmbedBuilder } = require('discord.js');
const DBHandler = require('@utils/DBHandler');
const { getTopTracks, getTopArtists, getTopAlbums, getLastFmUser } = require('@utils/api');

module.exports.data = new SlashCommandSubcommandBuilder()
    .setName('mostplayed')
    .setDescription('Gets the most played artist / track / album for a user on LastFM')
    .addStringOption(option =>
        option.setName('type')
            .setDescription('Type of top data to get')
            .addChoices(
                { name: 'Track', value: 'track' },
                { name: 'Album', value: 'album' },
                { name: 'Artist', value: 'artist' },
            )
            .setRequired(true))
    .addStringOption(option =>
        option.setName('username')
            .setDescription('LastFM Username'))
    .addUserOption(option =>
        option.setName('member')
            .setDescription('User in server to check'));
    

module.exports.execute = async function handleMostPlayed(interaction) {
    let username = interaction.options.getString('username');
    let mention = interaction.options.getUser('member');
    let userID = interaction.user.id;

    if (username === null && mention !== null) {
        userID = mention.id;
        const userData = await DBHandler.loadUserData(userID);
        if (userData) {
            username = userData.lastFMUsername;
        } else {
            return interaction.reply({ content: 'No username found for the mentioned user.', ephemeral: true });
        }
    } else if (username !== null && mention === null) {
        // Use the provided username
    } else if (username === null && mention === null) {
        const userData = await DBHandler.loadUserData(userID);
        if (userData) {
            username = userData.lastFMUsername;
        } else {
            return interaction.reply({ content: 'Please provide either a username, mention a member, or set your username with the command `/lastfm username`.', ephemeral: true });
        }
    } else {
        return interaction.reply({ content: 'Please provide either a LastFM username or mention a member, not both.', ephemeral: true });
    }

    try {

        const topType = interaction.options.getString('type');
        let topData = null;
        let topTypeString = null;
        switch (topType) {
            case 'artist':
                topData = await getTopArtists(username);
                topTypeString = 'artist';
                break;
            case 'album':
                topData = await getTopAlbums(username);
                topTypeString = 'album';
                break;
            case 'track':
                topData = await getTopTracks(username);
                topTypeString = 'track';
                break;
            default:
                return interaction.reply({ content: 'Invalid type provided.', ephemeral: true });
        }

        if (topData.length === 0) {
            return interaction.reply({ content: `No ${topTypeString}s found for this user.`, ephemeral: true });
        }

        // Check if the Last.fm user exists
        const resUser = await getLastFmUser(username);
        if (!resUser) {
            return interaction.reply({ content: 'The Last.fm username does not exist.', ephemeral: true });
        }

        // makes the first letter of the TopTypeString uppercase
        topTypeString = topTypeString.charAt(0).toUpperCase() + topTypeString.slice(1);

        const embed = new EmbedBuilder()
            .setAuthor({ name: `${username}`, iconURL: `${resUser.image[0]['#text']}`, url: `${resUser.url}` })
            .setTitle(`Most Played ${topTypeString}\'s for ${username}`)
            .setColor('#e4141e')
            .setTimestamp();

            topData.slice(0, 5).forEach((data, index) => {

                if (topType === 'track' || topType === 'album') {
                    embed.addFields({name: `#${index + 1} ${data.artist.name} - ${data.name}`, value: `Playcount: ${data.playcount}`, inline: false});
                    return;
                } else {
                    embed.addFields({name: `#${index + 1} ${data.name}`, value: `Playcount: ${data.playcount}`, inline: false});
                    return;
                }
            });

        interaction.reply({ embeds: [embed] });

    } catch (error) {
        console.error('Error:', error);
        const detailedErrorUserId = '327885496036622347';
        const errorMessage = userID === detailedErrorUserId && error.response && error.response.data && error.response.data.message
            ? `An error occurred: ${error.response.data.message}`
            : 'An error occurred while fetching your info or user does not exist.';
        
        interaction.reply({ content: errorMessage, ephemeral: true });
    }
}