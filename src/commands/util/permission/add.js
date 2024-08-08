const { SlashCommandSubcommandBuilder } = require('discord.js');
const { addPermission } = require('@utils/permissions');

module.exports.data = new SlashCommandSubcommandBuilder()
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
            .addChoices(
                { name: 'Starboard', value: 'starboard' },
                { name: 'Roles', value: 'roles' },
                { name: 'Superuser', value: 'superuser' },
            ));

module.exports.execute = async function handlePermissionAdd(interaction) {
    const user = interaction.options.getUser('user');
    const permission = interaction.options.getString('permission');
    const serverId = interaction.guild.id;

    try {
        await addPermission(serverId, user.id, permission);
        await interaction.reply({ content: `Permission \`${permission}\` added to ${user.tag}.`, ephemeral: true });
    } catch (err) {
        console.error(err);
        await interaction.reply({ content: 'Failed to add permission.', ephemeral: true });
    }
};