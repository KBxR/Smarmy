const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { hasPermission } = require('@utils/permissions');

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

        async function hasRolesPermission(serverId, userId, member) {
            const hasCustomPermission = await hasPermission(serverId, userId, 'roles');
            const hasManageRolesPermission = member.permissions.has(PermissionsBitField.Flags.ManageRoles);
        
            return hasCustomPermission || hasManageRolesPermission;
        }

        const serverId = interaction.guild.id;
        const userId = interaction.user.id;
        const member = interaction.member;

        if (!await hasRolesPermission(serverId, userId, member)) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        const subcommand = interaction.options.getSubcommand();
        const commandFile = require(`./role/${subcommand}.js`);
        await commandFile.execute(interaction);
    }
};