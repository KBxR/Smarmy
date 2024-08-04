const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');
const { Client } = require('pg');
const { databasePath } = require('@config');
const permissionsData = require('./permissions.json');

const client = new Client({
    connectionString: databasePath,
});

client.connect();

const permissionChoices = permissionsData.permissions.map(permission => ({
    name: permission.name,
    value: permission.name
}));

module.exports = {
    data: new SlashCommandBuilder()
        .setName('permission')
        .setDescription('Manage user permissions')
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add a permission to a user')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to grant permission to')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('permission')
                        .setDescription('The permission to grant')
                        .setRequired(true)
                        .addChoices(...permissionChoices)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove a permission from a user')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to revoke permission from')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('permission')
                        .setDescription('The permission to revoke')
                        .setRequired(true)
                        .addChoices(...permissionChoices)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List all available permissions')),
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
            await interaction.reply({ content: 'You do not have permission to manage the server.', ephemeral: true });
            return;
        }

        const subcommand = interaction.options.getSubcommand();
        const user = interaction.options.getUser('user');
        const permission = interaction.options.getString('permission');
        const serverId = interaction.guild.id;

        if (subcommand === 'add') {
            client.query(`
                INSERT INTO permissions (server_id, user_id, permission_name)
                VALUES ($1, $2, $3)
            `, [serverId, user.id, permission], (err, res) => {
                if (err) {
                    console.error(err);
                    interaction.reply({ content: 'Failed to add permission.', ephemeral: true });
                } else {
                    interaction.reply({ content: `Permission ${permission} added to ${user.tag}.`, ephemeral: true });
                }
            });
        } else if (subcommand === 'remove') {
            client.query(`
                DELETE FROM permissions
                WHERE server_id = $1 AND user_id = $2 AND permission_name = $3
            `, [serverId, user.id, permission], (err, res) => {
                if (err) {
                    console.error(err);
                    interaction.reply({ content: 'Failed to remove permission.', ephemeral: true });
                } else {
                    interaction.reply({ content: `Permission ${permission} removed from ${user.tag}.`, ephemeral: true });
                }
            });
        } else if (subcommand === 'list') {
            const embed = new EmbedBuilder()
                .setColor(0x0099ff)
                .setTitle('Available Permissions')
                .setTimestamp()
                .setFooter({ text: 'Permissions List' });

            permissionsData.permissions.forEach(permission => {
                embed.addFields({ name: permission.name, value: permission.description });
            });

            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }
};