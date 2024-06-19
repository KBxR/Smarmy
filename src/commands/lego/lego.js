const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const commandFiles = fs.readdirSync(path.join(__dirname, 'subcommands')).filter(file => file.endsWith('.js'));

const command = new SlashCommandBuilder()
    .setName('lego')
    .setDescription('LEGO!!!!!!');

for (const file of commandFiles) {
    const commandData = require(`./subcommands/${file}`);
    command.addSubcommand(() => commandData.data);
}

module.exports = {
    category: 'lego',
    data: command,
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const commandFile = require(`./subcommands/${subcommand}.js`);
        await commandFile.execute(interaction);
    }
};