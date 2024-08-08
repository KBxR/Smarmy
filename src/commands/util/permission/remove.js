const { SlashCommandSubcommandBuilder } = require('discord.js');
const { removePermission } = require('@utils/permissions');

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
                { name: 'Roles', value: 'roles' },
                { name: 'Superuser', value: 'superuser' },
            ));

module.exports.execute = async function handlePermissionRemove(interaction) {
    const user = interaction.options.getUser('user');
    const permission = interaction.options.getString('permission');
    const serverId = interaction.guild.id;

    try {
        await removePermission(serverId, user.id, permission);
        await interaction.reply({ content: `Permission \`${permission}\` removed from ${user.tag}.`, ephemeral: true });
    } catch (err) {
        console.error(err);
        await interaction.reply({ content: 'Failed to remove permission.', ephemeral: true });
    }
};