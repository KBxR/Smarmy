const { EmbedBuilder } = require('discord.js');
const { getBotInfo } = require('../../../utils/botInfoUtil');

module.exports = async function handleRoleRemove(interaction) {
    const role = interaction.options.getRole('role');
    const user = interaction.options.getUser('user');
    const member = interaction.options.getMember('user');

    const { authorName, authorIconUrl } = await getBotInfo();

    // Remove the role from the user
    await member.roles.remove(role);

    // Create an embed message to confirm role removal
    const roleRemoveEmbed = new EmbedBuilder()
        .setColor(role.color)
        .setTitle(`Removed ${role.name} from ${user.username}`)
        .setAuthor({ 
            name: authorName, 
            iconURL: authorIconUrl 
        })
        .addFields(
            { name: 'Role Name:', value: `<@&${role.id}>`, inline: false },
            { name: 'User:', value: `<@${user.id}>`, inline: false }
        );

    interaction.reply({ embeds: [roleRemoveEmbed] });
}
