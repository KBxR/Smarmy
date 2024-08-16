const { SlashCommandSubcommandBuilder, EmbedBuilder } = require('discord.js');
const { UserInfo, generateUserInfo } = require('@database/setup');
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
        let user = await UserInfo.findByPk(userID);
        if (!user) {
            console.log(`User with ID ${userID} not found. Generating new user info.`);
            await generateUserInfo(userID);
            try {
                user = await UserInfo.create({ user_id: userID, info: { lastfm: { username: username } } });
                console.log(`User with ID ${userID} created.`);
            } catch (error) {
                if (error.name === 'SequelizeUniqueConstraintError') {
                    console.log(`User with ID ${userID} already exists. Updating Last.fm username.`);
                    user = await UserInfo.findByPk(userID);
                    const updateData = {};
                    updateData['info.lastfm.username'] = username;
                    await user.update(updateData, { where: { user_id: userID } });
                    console.log(`User with ID ${userID} updated.`);
                } else {
                    throw error;
                }
            }
        } else {
            console.log(`User with ID ${userID} found. Updating Last.fm username.`);
            const updateData = {};
            updateData['info.lastfm.username'] = username;
            await user.update(updateData, { where: { user_id: userID } });
            console.log(`User with ID ${userID} updated.`);
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