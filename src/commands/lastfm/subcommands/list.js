const { SlashCommandSubcommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const DBHandler = require('@utils/DBHandler');
const lastFmKey = require('@config/config').lastFmKey;

module.exports.data = new SlashCommandSubcommandBuilder()
    .setName('list')
    .setDescription('Gives a list of most recent tracks')
    .addStringOption(option =>
        option.setName('username')
            .setDescription('LastFM Username'))
    .addUserOption(option =>
        option.setName('member')
            .setDescription('User in server to check'))
    .addStringOption(option =>
        option.setName('length')
            .setDescription('How many tracks you want displayed (Max length is 12)'));

module.exports.execute = async function handleList(interaction) {
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
        let length = interaction.options.getString('length');

        if (length === null) {
            length = 6;
        }

        if (length < 13 && length > 0) {
            const [resTrack, resUser] = await Promise.all([
                axios.get(`http://ws.audioscrobbler.com/2.0/?method=user.getRecentTracks&user=${username}&api_key=${lastFmKey}&format=json&nowplaying=true&limit=${length - 1}`),
                axios.get(`http://ws.audioscrobbler.com/2.0/?method=user.getinfo&user=${username}&api_key=${lastFmKey}&format=json`)
            ]);

            const recTracks = resTrack.data.recenttracks.track;
            const listArray = recTracks.map(track => track);

            const listEmbed = new EmbedBuilder()
                .setColor('#e4141e')
                .setTitle(`${username}'s Recently Played Tracks`)
                .setAuthor({ name: username, iconURL: resUser.data.user.image[0]['#text'], url: resUser.data.user.url })
                .setThumbnail(resUser.data.user.image[3]['#text'])
                .setFooter({ text: `Playcount: ${resUser.data.user.playcount}`, iconURL: 'https://www.last.fm/static/images/lastfm_avatar_twitter.52a5d69a85ac.png' });

            listArray.forEach(recTrack => {
                listEmbed.addFields({ name: 'Track:', value: `[${recTrack.artist['#text']} - ${recTrack.name}](${recTrack.url})`, inline: true });
            });

            interaction.reply({ embeds: [listEmbed] });
        } else {
            interaction.reply({ content: "Length must be less than 13 and more than 0", ephemeral: true });
        }
    } catch (error) {
        console.error('Error:', error);
        const detailedErrorUserId = '327885496036622347';
        const errorMessage = userID === detailedErrorUserId && error.response && error.response.data && error.response.data.message
            ? `An error occurred: ${error.response.data.message}`
            : 'An error occurred, please try again later.';
        
        interaction.reply({ content: errorMessage, ephemeral: true });
    }
};
