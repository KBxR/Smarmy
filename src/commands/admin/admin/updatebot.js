const { SlashCommandSubcommandBuilder } = require('@discordjs/builders');
const { ActivityType } = require('discord.js');
const axios = require('axios');
const { DBHandler } = require('@utils');

// Map between status type and ActivityType
const activityTypeMap = {
    Playing: ActivityType.Playing,
    Watching: ActivityType.Watching,
    Streaming: ActivityType.Streaming,
    Listening: ActivityType.Listening
};

async function updateAvatar(image, newValue, client, interaction) {
    const avatarValue = image ? image.url : newValue;
    if (!avatarValue) {
        return interaction.editReply({ content: 'Please provide a valid URL or upload an image to update the avatar.', ephemeral: true });
    }

    const response = image ? await axios.get(avatarValue, { responseType: 'arraybuffer' }) : null;
    const buffer = image ? Buffer.from(response.data, 'binary') : null;
    await client.user.setAvatar(buffer || avatarValue);

    // Store avatar URL in the database
    const avatarUrl = client.user.avatarURL();
    await DBHandler.saveBotInfo('avatar', avatarUrl);

    return interaction.editReply({ content: 'The bot\'s avatar has been updated.', ephemeral: true });
}

async function updateUsername(newValue, client, interaction) {
    if (!newValue) {
        return interaction.editReply({ content: 'Please provide a new username.', ephemeral: true });
    }
    await client.user.setUsername(newValue);

    // Store username in the database
    await DBHandler.saveBotInfo('username', newValue);

    return interaction.editReply({ content: 'The bot\'s username has been updated.', ephemeral: true });
}

async function updateStatus(newValue, statusType, client, interaction, activityTypeMap) {
    if (!newValue || !statusType) {
        return interaction.editReply({ content: 'Please provide both a new status and status type.', ephemeral: true });
    }
    
    // Store status type and name in the database
    await DBHandler.saveBotInfo('status_type', statusType);
    await DBHandler.saveBotInfo('status_name', newValue);
    
    // Set the bot's presence immediately
    client.user.setActivity(newValue, { type: activityTypeMap[statusType] });
    
    return interaction.editReply({ content: 'The bot\'s status has been updated.', ephemeral: true });
    }
    
    async function handleUpdate(updateType, image, newValue, statusType, client, interaction, activityTypeMap) {
        try {
    
            switch (updateType) {
                case 'avatar':
                    await updateAvatar(image, newValue, client, interaction);
                    break;
                case 'username':
                    await updateUsername(newValue, client, interaction);
                    break;
                case 'status':
                    await updateStatus(newValue, statusType, client, interaction, activityTypeMap);
                    break;
                default:
                    return interaction.editReply({ content: 'Invalid update type.', ephemeral: true });
            }
        } catch (error) {
            console.error('Error updating bot:', error);
            return interaction.editReply({ content: 'An error occurred while updating the bot. Please try again later.', ephemeral: true });
        }
    }
    
    module.exports.data = new SlashCommandSubcommandBuilder()
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
                .setDescription('The type of status (Playing, Watching, Streaming, Listening)')
        )
        .addAttachmentOption(option =>
            option.setName('image')
                .setDescription('The image to use for the avatar')
        );
        
module.exports.execute = async function handleUpdateBot(interaction) {
        const updateType = interaction.options.getString('type');
        const newValue = interaction.options.getString('value');
        const statusType = interaction.options.getString('status_type');
        const image = interaction.options.getAttachment('image');

        await interaction.deferReply({ ephemeral: true });

        try {
            const client = interaction.client;

            // Check if the file size is larger than 10,240 KB (10 MB)
            if (image && image.size > 10240 * 1024) {
                return interaction.editReply({ content: 'The uploaded file is too large. Please upload a file smaller than 10 MB.', ephemeral: true });
            }

            return await handleUpdate(updateType, image, newValue, statusType, client, interaction, activityTypeMap);
            
        } catch (error) {
            console.error('Error updating bot:', error);
            return interaction.editReply({ content: 'An error occurred while updating the bot. Please try again later.', ephemeral: true });
        }
};
