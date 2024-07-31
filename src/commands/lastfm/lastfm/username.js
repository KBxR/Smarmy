const { SlashCommandSubcommandBuilder, EmbedBuilder } = require('discord.js');
const { User } = require('@database/models');
const { getLastFmUser } = require('@api/lastFm');

module.exports.data = new SlashCommandSubcommandBuilder()
    .setName('username')
    .setDescription('Adds a LastFM username to your account')
    .addStringOption(option =>
        option.setName('username')
            .setDescription('LastFM Username')
            .setRequired(true));

module.exports.execute = async function handleUsername(interaction) {
    const username = interaction.options.getString('username');
    const userID = interaction.user.id;

    try {
        // Update or create the user record in the database
        let user = await User.findByPk(userID);
        if (!user) {
            user = await User.create({ userID: userID, lastFMUsername: username });
        } else {
            user.lastFMUsername = username;
            await user.save();
        }

        // Fetch user info from Last.fm
        const lastFmUser = await getLastFmUser(username);
        if (!lastFmUser || !lastFmUser.name) {
            console.log('Last.fm user not found:', lastFmUser);
            return interaction.reply({ content: 'The Last.fm username does not exist.', ephemeral: true });
        }

        const profilePic = lastFmUser.image[lastFmUser.image.length - 1]['#text'];
        const scrobbleCount = lastFmUser.playcount;
        const accountCreationDate = new Date(lastFmUser.registered.unixtime * 1000).toLocaleDateString();

        // Create the embed
        const embed = new EmbedBuilder()
            .setColor('#e4141e')
            .setTitle('Last.fm Username Added/Updated')
            .setAuthor({ name: username, iconURL: profilePic, url: lastFmUser.url })
            .addFields(
                { name: 'Username', value: username, inline: true },
                { name: 'Scrobble Count', value: scrobbleCount.toString(), inline: true },
                { name: 'Account Creation Date', value: accountCreationDate, inline: true }
            )
            .setThumbnail(profilePic)
            .setDescription(`Your Last.fm username has been saved/updated to \`${username}\`.`);

        interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (error) {
        console.error('Error handling username command:', error);
        interaction.reply({ content: 'There was an error while processing your request.', ephemeral: true });
    }
};