const { EmbedBuilder } = require('discord.js');
const { getBotInfo } = require('../../../utils/botInfoUtil');

module.exports = async function handleRoleGive(interaction) {
    const role = interaction.options.getRole('role');
    const user = interaction.options.getUser('user');
    const member = interaction.options.getMember('user');

    const { authorName, authorIconUrl } = await getBotInfo();

    // Assign the role to the user
    await member.roles.add(role);

    // Create an embed message to confirm role assignment
    const roleGiveEmbed = new EmbedBuilder()
        .setColor(role.color)
        .setTitle(`Gave ${user.username} a role`)
        .setAuthor({ 
            name: authorName, 
            iconURL: authorIconUrl 
        })
        .addFields(
            { name: 'Role Name:', value: `<@&${role.id}>`, inline: false },
            { name: 'User:', value: `<@${user.id}>`, inline: false }
        );

    interaction.reply({ embeds: [roleGiveEmbed] });
}
