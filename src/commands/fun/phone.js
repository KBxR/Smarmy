const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const commandFiles = fs.readdirSync(path.join(__dirname, 'phone')).filter(file => file.endsWith('.js'));

const command = new SlashCommandBuilder()
    .setName('phone')
    .setDescription('Phone Options');

for (const file of commandFiles) {
    const commandData = require(`./phone/${file}`);
    command.addSubcommand(() => commandData.data);
}

module.exports = {
    data: command,
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const commandFile = require(`./phone/${subcommand}.js`);
        await commandFile.execute(interaction);
    }
};