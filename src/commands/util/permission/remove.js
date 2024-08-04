const { SlashCommandSubcommandBuilder } = require('discord.js');
const { Client } = require('pg');
const { databasePath } = require('@config');

const client = new Client({
    connectionString: `${databasePath}`,
});

client.connect();

module.exports.data = new SlashCommandSubcommandBuilder()
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
            .addChoices(
                { name: 'Starboard', value: 'starboard' },
            ));

module.exports.execute = async function handlePermissionRemove(interaction) {
    const user = interaction.options.getUser('user');
    const permission = interaction.options.getString('permission');
    const serverId = interaction.guild.id;

    client.query(`
        DELETE FROM permissions
        WHERE server_id = $1 AND user_id = $2 AND permission_name = $3
    `, [serverId, user.id, permission], async (err, res) => {
        if (err) {
            console.error(err);
            await interaction.reply({ content: 'Failed to remove permission.', ephemeral: true });
        } else {
            await interaction.reply({ content: `Permission \`${permission}\` removed from ${user.tag}.`, ephemeral: true });
        }
    });
};