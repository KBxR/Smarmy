const { SlashCommandBuilder } = require('discord.js');
const config = require('@config/config');
const fs = require('fs');
const path = require('path');

module.exports = {
    category: 'admin',
    data: new SlashCommandBuilder()
        .setName('reload')
        .setDescription('Reloads a command.')
        .addStringOption(option =>
            option.setName('command')
                .setDescription('The command to reload.')
                .setRequired(true)),
    async execute(interaction) {
        if (interaction.user.id !== config.adminId) {
            return interaction.reply({ content: `You do not have permission to use this command`, ephemeral: true });
        }

        const commandName = interaction.options.getString('command', true).toLowerCase();
        let command = interaction.client.commands.get(commandName);

        if (!command) {
            return interaction.reply(`There is no command with name \`${commandName}\`!`);
        }

        // Dynamically find the command file based on its name and category
        const commandFolders = fs.readdirSync(path.join(__dirname, '..'));
        let filePath;
        for (const folder of commandFolders) {
            try {
                const commandFiles = fs.readdirSync(path.join(__dirname, '..', folder)).filter(file => file.endsWith('.js'));
                if (commandFiles.includes(`${commandName}.js`)) {
                    filePath = `../${folder}/${commandName}.js`;
                    break;
                }
            } catch (error) {
                console.error(`Failed to read directory: ${folder}`, error);
            }
        }

        if (!filePath) {
            return interaction.reply(`Failed to locate the command file for \`${commandName}\`.`);
        }

        try {
            delete require.cache[require.resolve(filePath)];
            command = require(filePath);
            interaction.client.commands.set(command.data.name, command);
            await interaction.reply(`Command \`${command.data.name}\` was reloaded!`);
        } catch (error) {
            console.error(error);
            await interaction.reply(`There was an error while reloading a command \`${commandName}\`:\n\`${error.message}\``);
        }
    },
};