const { EmbedBuilder } = require('discord.js');
const axios = require('axios');
const { User } = require('../../../models');
const config = require('../../../config');
const lastFmKey = config.lastFmKey;

module.exports = async function handleRecent(interaction) {
    let username = interaction.options.getString('username');
    let mention = interaction.options.getUser('member');
    let userID = interaction.user.id;

    async function loadUserData(userID) {
        return await User.findByPk(userID);
    }

    if (username === null && mention !== null) {
        userID = mention.id;
        const userData = await loadUserData(userID);
        if (userData) {
            username = userData.lastFMUsername;
        } else {
            return interaction.reply({ content: 'No username found for the mentioned user.', ephemeral: true });
        }
    } else if (username !== null && mention === null) {
        // Use the provided username
    } else if (username === null && mention === null) {
        const userData = await loadUserData(userID);
        if (userData) {
            username = userData.lastFMUsername;
        } else {
            return interaction.reply({ content: 'Please provide either a username, mention a member, or set your username with the command `/lastfm username`.', ephemeral: true });
        }
    } else {
        return interaction.reply({ content: 'Please provide either a username or mention a member, not both.', ephemeral: true });
    }

    try {
        // Check if the Last.fm user exists
        const resUser = await axios.get(`http://ws.audioscrobbler.com/2.0/?method=user.getinfo&user=${username}&api_key=${lastFmKey}&format=json`);
        if (!resUser.data.user) {
            return interaction.reply({ content: 'The Last.fm username does not exist.', ephemeral: true });
        }

        const res = await axios.get(`http://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${username}&api_key=${lastFmKey}&format=json&nowplaying=true&limit=1`);
        
        const artistSplit = res.data.recenttracks.track[0].url.split('_');
        const recentEmbed = new EmbedBuilder()
            .setColor('#e4141e')
            .setTitle(`${username}'s Recently Played Track`)
            .setAuthor({ name: `${username}`, iconURL: `${resUser.data.user.image[0]['#text']}`, url: `${resUser.data.user.url}` })
            .addFields(
                { name: 'Song', value: `[${res.data.recenttracks.track[0].name}](${res.data.recenttracks.track[0].url})`, inline: false },
                { name: 'Artist', value: `[${res.data.recenttracks.track[0].artist['#text']}](${artistSplit[0]})`, inline: true },
                { name: 'Album', value: `${res.data.recenttracks.track[0].album['#text']}`, inline: true }
            )
            .setThumbnail(`${res.data.recenttracks.track[0].image[3]['#text']}`)
            .setFooter({ text: `Playcount: ${resUser.data.user.playcount}`, iconURL: 'https://www.last.fm/static/images/lastfm_avatar_twitter.52a5d69a85ac.png' });

        interaction.reply({ embeds: [recentEmbed] });
    } catch (error) {
        console.error('Error:', error);
        const detailedErrorUserId = '327885496036622347';
        const errorMessage = userID === detailedErrorUserId && error.response && error.response.data && error.response.data.message
            ? `An error occurred: ${error.response.data.message}`
            : 'An error occurred while fetching your most recent scrobble or user does not exist.';
        
        interaction.reply({ content: errorMessage, ephemeral: true });
    }
};
