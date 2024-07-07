const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const commandFiles = fs.readdirSync(path.join(__dirname, 'isaac')).filter(file => file.endsWith('.js'));

const command = new SlashCommandBuilder()
    .setName('isaac')
    .setDescription('Isaac Options');

for (const file of commandFiles) {
    const commandData = require(`./isaac/${file}`);
    command.addSubcommand(() => commandData.data);
}

module.exports = {
    data: command,
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const commandFile = require(`./isaac/${subcommand}.js`);
        await commandFile.execute(interaction);
    }
};