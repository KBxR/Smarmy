const { EmbedBuilder } = require('discord.js');
const axios = require('axios');
const { getBotInfo } = require('@utils/botInfoUtil');

module.exports = async function handleRoleCreate(interaction) {
    const name = interaction.options.getString('rolename');
    const color = interaction.options.getString('hexcode');
    const roleIcon = interaction.options.getAttachment('icon');

    try {
        const role = await interaction.guild.roles.create({ name, color });

        // Fetch bot info from the database using the utility function
        const { authorName, authorIconUrl } = await getBotInfo();

        // Create an embed message to confirm role creation
        const colorEmbed = new EmbedBuilder()
            .setColor(`#${color}`)
            .setTitle(`Created Role: ${name}`)
            .setAuthor({ 
                name: authorName, 
                iconURL: authorIconUrl 
            })
            .addFields(
                { name: 'Role Name:', value: name, inline: false },
                { name: 'Role Color:', value: color, inline: false }
            );

        if (roleIcon != null) {
            const response = await axios.get(roleIcon.url, { responseType: 'arraybuffer' });
            const image = Buffer.from(response.data, 'binary');
            
            await role.edit({
                icon: image
            });
            colorEmbed.setThumbnail(roleIcon.url);
        }

        interaction.reply({ embeds: [colorEmbed] });
    } catch (error) {
        console.error('Error creating role:', error);
        interaction.reply({ content: 'An error occurred while creating the role.', ephemeral: true });
    }
}
