const { SlashCommandSubcommandBuilder, EmbedBuilder } = require('discord.js');
const { getLastFmUser, getWeeklyTopArtists, getTopArtists, getWeeklyScrobbles } = require('@api/lastFm');
const { resolveUsername, DBHandler } = require('@utils');

module.exports.data = new SlashCommandSubcommandBuilder()
    .setName('info')
    .setDescription('Gets a users info on LastFM')
    .addStringOption(option =>
        option.setName('username')
            .setDescription('LastFM Username'))
    .addUserOption(option =>
        option.setName('member')
            .setDescription('User in server to check'));

module.exports.execute = async function handleInfo(interaction) {
    let username = interaction.options.getString('username');
    let mention = interaction.options.getUser('member');
    let userID = interaction.user.id;

    const result = await resolveUsername({ username, mention, userID, interaction, DBHandler });
    if (result.error) {
        return interaction.reply({ content: result.error, ephemeral: true });
    }
    username = result.username;

    try {
        const userInfo = await getLastFmUser(username);
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