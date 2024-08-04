const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const fs = require('fs');
const path = require('path');

const commandFiles = fs.readdirSync(path.join(__dirname, 'permission')).filter(file => file.endsWith('.js'));

const command = new SlashCommandBuilder()
    .setName('permission')
    .setDescription('Permission Options');

for (const file of commandFiles) {
    const commandData = require(`./permission/${file}`);
    command.addSubcommand(() => commandData.data);
}

module.exports = {
    data: command,
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        const subcommand = interaction.options.getSubcommand();
        const commandFile = require(`./permission/${subcommand}.js`);
        await commandFile.execute(interaction);
    }
};