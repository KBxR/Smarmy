const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const commandFiles = fs.readdirSync(path.join(__dirname, 'role')).filter(file => file.endsWith('.js'));

const command = new SlashCommandBuilder()
    .setName('role')
    .setDescription('Role Options');

for (const file of commandFiles) {
    const commandData = require(`./role/${file}`);
    command.addSubcommand(() => commandData.data);
}

module.exports = {
    data: command,
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const commandFile = require(`./role/${subcommand}.js`);
        await commandFile.execute(interaction);
    }
};