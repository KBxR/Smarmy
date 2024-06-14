const { EmbedBuilder } = require('discord.js');
const DBHandler = require('@utils/DBHandler');
const { getLastFmUser, getRecentTracks } = require('@utils/api');

module.exports = async function handleList(interaction) {
    const userID = interaction.user.id;
    let username = interaction.options.getString('username');
    try {
        const user = await DBHandler.loadUserData(userID);

        // If username is null, check the database for the Last.fm username
        if (username === null) {
            if (!user || !user.lastFMUsername) {
                return interaction.reply({ content: 'Please provide either a username, mention a member, or set your username with the command `/lastfm username`.', ephemeral: true });
            }
            username = user.lastFMUsername;
        }

        let length = interaction.options.getString('length');

        if (length === null) {
            length = 6;
        }

        if (length < 13 && length > 0) {
            const [resTrack, resUser] = await Promise.all([
                getLastFmUser(username),
                getRecentTracks(username)
            ]);

            const recTracks = resTrack.track;
            const listArray = recTracks.map(track => track);

            const listEmbed = new EmbedBuilder()
                .setColor('#e4141e')
                .setTitle(`${username}'s Recently Played Tracks`)
                .setAuthor({ name: username, iconURL: resUser.image[0]['#text'], url: resUser.url })
                .setThumbnail(resUser.image[3]['#text'])
                .setFooter({ text: `Playcount: ${resUser.playcount}`, iconURL: 'https://www.last.fm/static/images/lastfm_avatar_twitter.52a5d69a85ac.png' });

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
            : 'An error occurred while fetching a list your most recent scrobble or user does not exist.';
        
        interaction.reply({ content: errorMessage, ephemeral: true });
    }
};
