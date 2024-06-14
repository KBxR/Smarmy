const axios = require('axios');
const { EmbedBuilder } = require('discord.js');
const config = require('@config/config');
const DBHandler = require('@utils/DBHandler');
const lastFmKey = config.lastFmKey;

module.exports = async function handleLastFmInfo(interaction) {
    let username = interaction.options.getString('username');
    const mention = interaction.options.getUser('member');
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
        return interaction.reply({ content: 'Please provide either a username or mention a member, not both.', ephemeral: true });
    }

    try {
        // Get user's information
        const userInfoResponse = await axios.get(`http://ws.audioscrobbler.com/2.0/?method=user.getinfo&user=${username}&api_key=${lastFmKey}&format=json`);
        const avatar = userInfoResponse.data.user.image[3]['#text'];
        const scrobbles = userInfoResponse.data.user.playcount;

        // Get user's weekly top artists
        const weeklyTopArtistsResponse = await axios.get(`http://ws.audioscrobbler.com/2.0/?method=user.getweeklyartistchart&user=${username}&api_key=${lastFmKey}&format=json`);
        const weeklyTopArtists = weeklyTopArtistsResponse.data.weeklyartistchart.artist.slice(0, 3).map(artist => artist.name);

        // Get user's lifetime top artists
        const topArtistsResponse = await axios.get(`http://ws.audioscrobbler.com/2.0/?method=user.gettopartists&user=${username}&api_key=${lastFmKey}&format=json`);
        const topArtists = topArtistsResponse.data.topartists.artist.slice(0, 3).map(artist => artist.name);

        // Get user's weekly scrobbles
        const weeklyScrobblesResponse = await axios.get(`http://ws.audioscrobbler.com/2.0/?method=user.getweeklytrackchart&user=${username}&api_key=${lastFmKey}&format=json`);
        const weeklyScrobbles = weeklyScrobblesResponse.data.weeklytrackchart.track.length;

        // Create an embed message
        const embed = new EmbedBuilder()
            .setColor('#e4141e')
            .setTitle(`Last.fm Info for ${username}`)
            .setURL(`https://www.last.fm/user/${username}`)
            .setThumbnail(avatar)
            .setDescription(`Weekly Scrobbles: ${weeklyScrobbles}`)

        weeklyTopArtists.forEach((artist, index) => {
            embed.addFields({name: `Weekly Top Artist ${index + 1}`, value: `[${artist}](https://www.last.fm/music/${encodeURIComponent(artist)})`, inline: true});
        });

        topArtists.forEach((artist, index) => {
            embed.addFields({name: `Lifetime Top Artist ${index + 1}`, value: `[${artist}](https://www.last.fm/music/${encodeURIComponent(artist)})`, inline: true});
        });

        embed.setFooter({text: `Total Scrobbles: ${scrobbles}`, iconURL: 'https://www.last.fm/static/images/lastfm_avatar_twitter.52a5d69a85ac.png' });

        // Send the embed message
        return interaction.reply({ embeds: [embed], ephemeral: false });

    } catch (error) {
        console.error('Error:', error);
        return interaction.reply({ content: 'An error occurred while fetching the data.', ephemeral: true });
    }
}