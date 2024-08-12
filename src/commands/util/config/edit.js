const { SlashCommandSubcommandBuilder } = require('discord.js');
const { ServerConfig } = require('@database/setup');

module.exports.data = new SlashCommandSubcommandBuilder()
    .setName('edit')
    .setDescription('Edit a configuration field in the server_config table')
    .addStringOption(option =>
        option.setName('field')
            .setDescription('The configuration field to edit')
            .setRequired(true)
            .addChoices(
                { name: 'starboard.channelToSend', value: 'starboard.channelToSend' },
                { name: 'starboard.channelToListen', value: 'starboard.channelToListen' },
                { name: 'starboard.emoji', value: 'starboard.emoji' },
                { name: 'starboard.threshold', value: 'starboard.threshold' },
                { name: 'starboard.adminOnly', value: 'starboard.adminOnly' },
                { name: 'starboard.enabled', value: 'starboard.enabled' },
                { name: 'superuser.enabled', value: 'superuser.enabled' }
            )
    )
    .addChannelOption(option =>
        option.setName('channel')
            .setDescription('The channel to set for the configuration field')
    )
    .addStringOption(option =>
        option.setName('value')
            .setDescription('The new value for the configuration field')
    );

module.exports.execute = async function handleEditConfig(interaction) {
    const serverId = interaction.guild.id; // Get the server ID from the interaction's guild
    const field = interaction.options.getString('field');
    const value = interaction.options.getString('value');
    const channel = interaction.options.getChannel('channel');
    
    try {
        const serverConfig = await ServerConfig.findOne({ where: { server_id: serverId } });
    
        if (!serverConfig) {
            await interaction.reply(`No configuration found for server ID ${serverId}.`);
            return;
        }

        const keys = field.split('.');
        const lastKey = keys.pop();
        const path = keys.join('.');

        const updateData = {};
        if (channel) {
            updateData[`config.${path}.${lastKey}`] = channel.id;
        } else if (value) {
            updateData[`config.${path}.${lastKey}`] = value;
        } else {
            await interaction.reply('You must provide either a channel or a value.');
            return;
        }

        console.log('Update data:', updateData);

        // Update the specific field in the JSONB column
        await serverConfig.update(updateData, { where: { server_id: serverId } });

        // Verify the update
        const updatedConfig = await ServerConfig.findOne({ where: { server_id: serverId } });
        console.log('Verified updated config:', updatedConfig.config);

        await interaction.reply(`Configuration field \`${field}\` has been updated to \`${channel ? channel.id : value}\` for server ID ${serverId}.`);
    } catch (error) {
        console.error('Error updating configuration field:', error);
        await interaction.reply('There was an error updating the configuration field.');
    }
};