const { SlashCommandSubcommandBuilder, EmbedBuilder } = require('discord.js');
const { getArtistInfo, getArtistInfoWUsername, getLastFmUser, getRecentTrack } = require('@api/lastFm');
const { DBHandler } = require('@utils');

module.exports.data = new SlashCommandSubcommandBuilder()
    .setName('artist')
    .setDescription('Gets an artist\'s information from LastFM')
    .addStringOption(option =>
        option.setName('artist')
            .setDescription('Artist name to search for'))
    .addStringOption(option =>
        option.setName('username')
            .setDescription('Your Last.FM username'));
            
module.exports.execute = async function handleArtistInfo(interaction) {
    let username = interaction.options.getString('username');
    let artist = interaction.options.getString('artist');
    let userID = interaction.user.id;
    
    if (username === null) {
        const userData = await DBHandler.loadUserData(userID);
        if (userData) {
            username = userData.lastFMUsername;
        }
    }

    if (artist === null) {
        const recentTrack = await getRecentTrack(username);
        artist = recentTrack.artist['#text'];
    }
    
    let res;
    let usr;
    try {
        if (username) {
            res = await getArtistInfoWUsername(artist, username);
            usr = true
        } else {
            res = await getArtistInfo(artist);
            usr = false
        }
    } catch (error) {
        console.error('Error:', error);
        return interaction.reply({ content: 'An error occurred, please try again later.', ephemeral: true });
    }

    try {
        // Check if the Last.fm user exists
        const resUser = await getLastFmUser(username);
        if (!resUser) {
            return interaction.reply({ content: 'The Last.fm username does not exist.', ephemeral: true });
        }

        const capFirst = artist.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        const summarySplit = res.bio.summary.split('<a');
        const artistEmbed = new EmbedBuilder()
            .setColor('#e4141e')
            .setTitle(`${capFirst}`)
            .addFields(
                { name: 'Summary', value: `${summarySplit[0]}`, inline: false },
                { name: 'Scrobbles', value: `${res.stats.playcount}`, inline: true },
                { name: 'Listeners', value: `${res.stats.listeners}`, inline: true }
            )
            .setThumbnail(`${res.image[3]['#text']}`)
            if (usr === true) {
                artistEmbed.addFields(
                    { name: 'Your Scrobbles', value: `${res.stats.userplaycount}`, inline: true }
                )
                artistEmbed.setAuthor({ name: `${username}`, iconURL: `${resUser.image[0]['#text']}`, url: `${resUser.url}` })
                artistEmbed.setFooter({ text: `Total Scrobbles: ${resUser.playcount}`, iconURL: 'https://www.last.fm/static/images/lastfm_avatar_twitter.52a5d69a85ac.png' });
            }
            interaction.reply({ embeds: [artistEmbed], ephemeral: false });

    } catch (error) {
        console.error('Error:', error);
        const detailedErrorUserId = '327885496036622347';
        const errorMessage = userID === detailedErrorUserId && error.response && error.response.data && error.response.data.message
            ? `An error occurred: ${error.response.data.message}`
            : 'An error occurred, please try again later.';
        
        interaction.reply({ content: errorMessage, ephemeral: true });
    }
}