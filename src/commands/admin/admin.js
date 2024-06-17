const config = require('@config/config');
const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const commandFiles = fs.readdirSync(path.join(__dirname, 'admin')).filter(file => file.endsWith('.js'));

const command = new SlashCommandBuilder()
    .setName('admin')
    .setDescription('Admin options');

for (const file of commandFiles) {
    const commandData = require(`./admin/${file}`);
    command.addSubcommand(() => commandData.data);
}

module.exports = {
    category: 'admin',
    data: command,
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const commandFile = require(`./admin/${subcommand}.js`);
        await commandFile.execute(interaction);
    }
};