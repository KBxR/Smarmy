const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const commandFiles = fs.readdirSync(path.join(__dirname, 'lastfm')).filter(file => file.endsWith('.js'));

const command = new SlashCommandBuilder()
    .setName('lastfm')
    .setDescription('LastFM Options');

for (const file of commandFiles) {
    const commandData = require(`./lastfm/${file}`);
    command.addSubcommand(() => commandData.data);
}

module.exports = {
    data: command,
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const commandFile = require(`./lastfm/${subcommand}.js`);
        await commandFile.execute(interaction);
    }
};