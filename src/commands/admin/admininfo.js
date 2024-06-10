const { SlashCommandBuilder } = require('discord.js');
const handleGuildList = require('./admininfo/list');
const config = require('../../config');

module.exports = {
    category: 'admin',
    data: new SlashCommandBuilder()
        .setName('admininfo')
        .setDescription('Info about the bot')

        // Role assignment subcommand
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('Sends a list of every guild the bot is in')
        ),
        
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        // Check if the user is authorized
        const userId = interaction.user.id;
        if (!config.adminId.includes(userId)) {
            return interaction.reply({ content: 'You are not authorized to use this command.', ephemeral: true });
        }

        try {
            if (subcommand === 'list') {
                await handleGuildList(interaction);
            } //else if (subcommand === 'give') {
                //await handleRoleGive(interaction);
            //}
        } catch (error) {
            console.error('Error executing command:', error);
            interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    },
};
