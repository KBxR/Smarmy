const { EmbedBuilder } = require('discord.js');
const { AUTHOR_NAME, AUTHOR_ICON_URL } = require('../../config/embedConfig.json');

module.exports = async function handleRoleRemove(interaction) {
    const role = interaction.options.getRole('role');
    const user = interaction.options.getUser('user');
    const member = interaction.options.getMember('user');

    // Remove the role from the user
    await member.roles.remove(role);

    // Create an embed message to confirm role removal
    const roleRemoveEmbed = new EmbedBuilder()
        .setColor(role.color)
        .setTitle(`Removed ${role.name} from ${user.username}`)
        .setAuthor({ 
            name: AUTHOR_NAME, 
            iconURL: AUTHOR_ICON_URL 
        })
        .addFields(
            { name: 'Role Name:', value: `<@&${role.id}>`, inline: false },
            { name: 'User:', value: `<@${user.id}>`, inline: false }
        );

    interaction.reply({ embeds: [roleRemoveEmbed] });
}
