const { Events } = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        // Check for chat input command
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);

            if (!command) {
                console.error(`No command matching ${interaction.commandName} was found.`);
                return;
            }

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(error);
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
                } else {
                    await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
                }
            }
        }
        // Check for autocomplete interaction
        else if (interaction.isAutocomplete()) {
            const command = interaction.client.commands.get(interaction.commandName);

            if (!command || !command.autocomplete) {
                console.error(`No autocomplete handler found for ${interaction.commandName}.`);
                return;
            }

            try {
                await command.autocomplete(interaction);
            } catch (error) {
                console.error(`Error handling autocomplete for ${interaction.commandName}:`, error);
                // Note: Discord API does not allow responding to autocomplete interactions with an error message
            }
        }
    },
};