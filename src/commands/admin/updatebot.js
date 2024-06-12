const { SlashCommandBuilder } = require('@discordjs/builders');
const { ActivityType } = require('discord.js');
const axios = require('axios');
const DBHandler = require('@utils/DBHandler');

// Map between status type and ActivityType
const activityTypeMap = {
    Playing: ActivityType.Playing,
    Watching: ActivityType.Watching,
    Streaming: ActivityType.Streaming,
    Listening: ActivityType.Listening
};

module.exports = {
    category: 'admin',
    data: new SlashCommandBuilder()
        .setName('updatebot')
        .setDescription('Update the bot\'s avatar, username, or status.')
        .addStringOption(option =>
            option.setName('type')
                .setDescription('The type of update')
                .setRequired(true)
                .addChoices(
                    { name: 'Avatar', value: 'avatar' },
                    { name: 'Username', value: 'username' },
                    { name: 'Status', value: 'status' }
                )
        )
        .addStringOption(option =>
            option.setName('value')
                .setDescription('The new value for the selected type (URL for avatar, text for username/status)')
        )
        .addStringOption(option =>
            option.setName('status_type')
                .setDescription('The type of status (e.g., "Playing", "Watching", "Streaming", "Listening")')
                .addChoices(
                    { name: 'Playing', value: 'Playing' },
                    { name: 'Watching', value: 'Watching' },
                    { name: 'Streaming', value: 'Streaming' },
                    { name: 'Listening', value: 'Listening' }
                )
        )
        .addAttachmentOption(option =>
            option.setName('image')
                .setDescription('The image to set as the new avatar')
        ),
    async execute(interaction) {
        const updateType = interaction.options.getString('type');
        const newValue = interaction.options.getString('value');
        const statusType = interaction.options.getString('status_type');
        const image = interaction.options.getAttachment('image');

        try {
            const client = interaction.client;

            if (updateType === 'avatar') {
                if (image) {
                    const imageUrl = image.url;
                    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
                    const buffer = Buffer.from(response.data, 'binary');
                    await client.user.setAvatar(buffer);

                    // Store avatar URL in the database
                    const avatarUrl = client.user.avatarURL();
                    await DBHandler.saveBotInfo('avatar', avatarUrl);

                    return interaction.reply({ content: 'The bot\'s avatar has been updated.', ephemeral: true });
                } else if (newValue) {
                    await client.user.setAvatar(newValue);

                    // Store avatar URL in the database
                    const avatarUrl = client.user.avatarURL();
                    await DBHandler.saveBotInfo('avatar', avatarUrl);

                    return interaction.reply({ content: 'The bot\'s avatar has been updated.', ephemeral: true });
                } else {
                    return interaction.reply({ content: 'Please provide a valid URL or upload an image to update the avatar.', ephemeral: true });
                }
            } else if (updateType === 'username') {
                if (!newValue) {
                    return interaction.reply({ content: 'Please provide a new username.', ephemeral: true });
                }
                await client.user.setUsername(newValue);

                // Store username in the database
                await DBHandler.saveBotInfo('username', newValue);

                return interaction.reply({ content: 'The bot\'s username has been updated.', ephemeral: true });
            } else if (updateType === 'status') {
                if (!newValue || !statusType) {
                    return interaction.reply({ content: 'Please provide both a new status and status type.', ephemeral: true });
                }

                // Store status type and name in the database
                await DBHandler.saveBotInfo('status_type', statusType);
                await DBHandler.saveBotInfo('status_name', newValue);

                // Set the bot's presence immediately
                client.user.setActivity(newValue, { type: activityTypeMap[statusType] });

                return interaction.reply({ content: 'The bot\'s status has been updated.', ephemeral: true });
            }
        } catch (error) {
            console.error('Error updating bot:', error);
            return interaction.reply({ content: 'An error occurred while updating the bot. Please try again later.', ephemeral: true });
        }
    }
};
