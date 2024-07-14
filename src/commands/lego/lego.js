const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const commandFiles = fs.readdirSync(path.join(__dirname, 'lego')).filter(file => file.endsWith('.js'));

const command = new SlashCommandBuilder()
    .setName('lego')
    .setDescription('LEGO!!!!!!');

for (const file of commandFiles) {
    const commandData = require(`./lego/${file}`);
    command.addSubcommand(() => commandData.data);
}

module.exports = {
    category: 'lego',
    data: command,
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const commandFile = require(`./lego/${subcommand}.js`);
        await commandFile.execute(interaction);
    }
};