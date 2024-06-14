const { EmbedBuilder } = require('discord.js');
const DBHandler = require('@utils/DBHandler');
const { getLastFmUser, getRecentTrack } = require('@utils/api');

module.exports = async function handleRecent(interaction) {
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
        // Check if the Last.fm user exists
        const resUser = await getLastFmUser(username);
        if (!resUser) {
            return interaction.reply({ content: 'The Last.fm username does not exist.', ephemeral: true });
        }

        const res = await getRecentTrack(username);
        
        const artistSplit = res.url.split('_');
        const recentEmbed = new EmbedBuilder()
            .setColor('#e4141e')
            .setTitle(`${username}'s Recently Played Track`)
            .setAuthor({ name: `${username}`, iconURL: `${resUser.image[0]['#text']}`, url: `${resUser.url}` })
            .addFields(
                { name: 'Artist', value: `[${res.artist['#text']}](${artistSplit[0]})`, inline: false },
                { name: 'Song', value: `[${res.name}](${res.url})`, inline: true },
                { name: 'Album', value: `${res.album['#text']}`, inline: true }
            )
            .setThumbnail(`${res.image[3]['#text']}`)
            .setFooter({ text: `Playcount: ${resUser.playcount}`, iconURL: 'https://www.last.fm/static/images/lastfm_avatar_twitter.52a5d69a85ac.png' });

        interaction.reply({ embeds: [recentEmbed], ephemeral: false });
    } catch (error) {
        console.error('Error:', error);
        const detailedErrorUserId = '327885496036622347';
        const errorMessage = userID === detailedErrorUserId && error.response && error.response.data && error.response.data.message
            ? `An error occurred: ${error.response.data.message}`
            : 'An error occurred, please try again later.';
        
        interaction.reply({ content: errorMessage, ephemeral: true });
    }
};
