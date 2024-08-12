const { SlashCommandSubcommandBuilder } = require('discord.js');
const { setupDatabase } = require('@database/setup');

module.exports.data = new SlashCommandSubcommandBuilder()
    .setName('forceconfig')
    .setDescription('Force a server config to be created by inserting a server ID')
    .addStringOption(option =>
        option.setName('serverid')
            .setDescription('The ID of the server')
            .setRequired(true)
    );

module.exports.execute = async function handleForceConfig(interaction) {
    const serverId = interaction.options.getString('serverid');
    try {
        await setupDatabase(serverId);
        await interaction.reply(`Config for server ID ${serverId} has been created or already exists.`);
    } catch (error) {
        console.error('Error creating server config:', error);
        await interaction.reply('There was an error creating the server config.');
    }
};