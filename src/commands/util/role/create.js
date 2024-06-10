const { EmbedBuilder } = require('discord.js');
const { AUTHOR_NAME, AUTHOR_ICON_URL } = require('../../config/embedConfig.json');

module.exports = async function handleRoleCreate(interaction) {
    const name = interaction.options.getString('rolename');
    const color = interaction.options.getString('hexcode');
    const roleIcon = interaction.options.getAttachment('roleicon'); // Get the role icon attachment

    // Create the role
    const createdRole = await interaction.guild.roles.create({ name, color });

    // Create an embed message to confirm role creation
    const colorEmbed = new EmbedBuilder()
        .setColor(`#${color}`)
        .setTitle(`Created Role: ${name}`)
        .setAuthor({ 
            name: AUTHOR_NAME, 
            iconURL: AUTHOR_ICON_URL 
        })
        .addFields(
            { name: 'Role Name:', value: name, inline: false },
            { name: 'Role Color:', value: color, inline: false }
        );

    // If a role icon is attached, set it as the thumbnail
    if (roleIcon) {
        colorEmbed.setThumbnail(roleIcon.url);
    }

    interaction.reply({ embeds: [colorEmbed] });
}
