const { EmbedBuilder } = require('discord.js');
const DBHandler = require('@utils/DBHandler');
const { getLastFmUserInfo, getWeeklyTopArtists, getTopArtists, getWeeklyScrobbles } = require('@utils/api');

module.exports = async function handleLastFmInfo(interaction) {
    let username = interaction.options.getString('username');
    const mention = interaction.options.getUser('member');
    let userID = interaction.user.id;

    if (mention !== null) {
        userID = mention.id;
    }
    
    const userData = await DBHandler.loadUserData(userID);
    
    if (userData) {
        username = userData.lastFMUsername;
    }
    
    if (username === null) {
        if (mention !== null) {
            return interaction.reply({ content: 'No username found for the mentioned user.', ephemeral: true });
        } else {
            return interaction.reply({ content: 'Please provide either a username, mention a member, or set your username with the command `/lastfm username`.', ephemeral: true });
        }
    } else if (username !== null && mention !== null) {
        return interaction.reply({ content: 'Please provide either a username or mention a member, not both.', ephemeral: true });
    }

    try {
        const userInfo = await getLastFmUserInfo(username);
        const avatar = userInfo.image[3]['#text'];
        const scrobbles = userInfo.playcount;
    
        const weeklyTopArtists = (await getWeeklyTopArtists(username)).slice(0, 3);
        const topArtists = (await getTopArtists(username)).slice(0, 3);
        const weeklyScrobbles = (await getWeeklyScrobbles(username)).length;
        const accountCreationDate = new Date(userInfo.registered['#text'] * 1000).toLocaleDateString();
    
        // Create an embed message
        const embed = new EmbedBuilder()
            .setColor('#e4141e')
            .setTitle(`Last.fm Info for ${username}`)
            .setURL(`https://www.last.fm/user/${username}`)
            .setThumbnail(avatar)
            .addFields(
                { name: 'Account Creation Date', value: accountCreationDate, inline: false },
                { name: 'Weekly Scrobble Count', value: weeklyScrobbles.toString(), inline: false })
    
        weeklyTopArtists.forEach((artist, index) => {
            embed.addFields({name: `Weekly Top Artist #${index + 1} (${artist.playcount})`, value: `[${artist.name}](https://www.last.fm/music/${encodeURIComponent(artist.name)})`, inline: true});
        });
    
        topArtists.forEach((artist, index) => {
            embed.addFields({name: `Lifetime Top Artist #${index + 1} (${artist.playcount})`, value: `[${artist.name}](https://www.last.fm/music/${encodeURIComponent(artist.name)})`, inline: true});
        });
    
        embed.setFooter({text: `Total Scrobbles: ${scrobbles}`, iconURL: 'https://www.last.fm/static/images/lastfm_avatar_twitter.52a5d69a85ac.png' });

        // Send the embed message
        return interaction.reply({ embeds: [embed], ephemeral: false });

    } catch (error) {
        console.error('Error:', error);
        const detailedErrorUserId = '327885496036622347';
        const errorMessage = userID === detailedErrorUserId && error.response && error.response.data && error.response.data.message
            ? `An error occurred: ${error.response.data.message}`
            : 'An error occurred while fetching your info or user does not exist.';
        
        interaction.reply({ content: errorMessage, ephemeral: true });
    }
}