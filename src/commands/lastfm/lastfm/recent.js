const { SlashCommandSubcommandBuilder, EmbedBuilder } = require('discord.js');
const { getLastFmUser, getRecentTracks } = require('@api/lastFm');
const { DBHandler } = require('@utils');
const { resolveUsername } = require('@lastFmUtils');

module.exports.data = new SlashCommandSubcommandBuilder()
    .setName('recent')
    .setDescription('Gets your most recent scrobble on LastFM')
    .addStringOption(option =>
        option.setName('username')
            .setDescription('LastFM Username'))
    .addUserOption(option =>
        option.setName('member')
            .setDescription('User in server to check'));

module.exports.execute = async function handleRecent(interaction) {
    let username = interaction.options.getString('username');
    let mention = interaction.options.getUser('member');
    let userID = interaction.user.id;
    
    // Acknowledge the interaction early
    await interaction.deferReply({ ephemeral: true });
    
    const result = await resolveUsername({ username, mention, userID, interaction, DBHandler });
    if (result.error) {
        return interaction.editReply({ content: result.error });
    }
    username = result.username;
    
    try {
        // Check if the Last.fm user exists
        const resUser = await getLastFmUser(username);
        if (!resUser) {
            return interaction.editReply({ content: 'The Last.fm username does not exist.' });
        }
    
        const resTrack = await getRecentTracks(username);
        
        const res = resTrack[0];
    
        const isCurrentlyPlaying = res['@attr'] && res['@attr'].nowplaying === 'true';
        const title = isCurrentlyPlaying ? `${username}'s Currently Playing Track` : `${username}'s Recently Played Track`;
    
        const artistSplit = res.url.split('_');
        const recentEmbed = new EmbedBuilder()
            .setColor('#e4141e')
            .setTitle(title)
            .setAuthor({ name: `${username}`, iconURL: `${resUser.image[0]['#text']}`, url: `${resUser.url}` })
            .addFields(
                { name: 'Artist', value: `[${res.artist['#text']}](${artistSplit[0]})`, inline: false },
                { name: 'Song', value: `[${res.name}](${res.url})`, inline: true },
                { name: 'Album', value: `${res.album['#text']}`, inline: true }
            )
            .setThumbnail(`${res.image[3]['#text']}`)
            .setFooter({ text: `Total Scrobbles: ${resUser.playcount}`, iconURL: 'https://www.last.fm/static/images/lastfm_avatar_twitter.52a5d69a85ac.png' });
    
        await interaction.editReply({ embeds: [recentEmbed] });
    } catch (error) {
        console.error('Error:', error);
        const detailedErrorUserId = '327885496036622347';
        const errorMessage = userID === detailedErrorUserId && error.response && error.response.data && error.response.data.message
            ? `An error occurred: ${error.response.data.message}`
            : 'An error occurred, please try again later.';
        
        await interaction.editReply({ content: errorMessage });
    }
};
