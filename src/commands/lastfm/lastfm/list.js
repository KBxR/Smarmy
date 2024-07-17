const { SlashCommandSubcommandBuilder, EmbedBuilder } = require('discord.js');
const { resolveUsername, DBHandler } = require('@utils');
const { getRecentTracks, getLastFmUser } = require('@api/lastFm.js');

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

    const result = await resolveUsername({ username, mention, userID, interaction, DBHandler });
    if (result.error) {
        return interaction.reply({ content: result.error, ephemeral: true });
    }
    username = result.username;

    try {
        let length = interaction.options.getString('length');
        length = length ? parseInt(length, 10) : 6;
        length = Math.max(1, Math.min(length, 12));

        const recentTracks = await getRecentTracks(username, length);
        const userInfo = await getLastFmUser(username);

        const listEmbed = new EmbedBuilder()
            .setColor('#e4141e')
            .setTitle(`${username}'s Recently Played Tracks`)
            .setAuthor({ name: username, iconURL: userInfo.image[0]['#text'], url: userInfo.url })
            .setThumbnail(userInfo.image[3]['#text'])
            .setFooter({ text: `Total Scrobbles: ${userInfo.playcount}`, iconURL: 'https://www.last.fm/static/images/lastfm_avatar_twitter.52a5d69a85ac.png' });

        recentTracks.forEach(recTrack => {
            listEmbed.addFields({ name: 'Track:', value: `[${recTrack.artist['#text']} - ${recTrack.name}](${recTrack.url})`, inline: true });
        });

        await interaction.reply({ embeds: [listEmbed] });
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
};