const { EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = async function handleRoleIcon(interaction) {

        const role = interaction.options.getRole('role');
        const iconAttachment = interaction.options.getAttachment('icon');

        try {
            const response = await axios.get(iconAttachment.url, { responseType: 'arraybuffer' });
            const image = Buffer.from(response.data, 'binary');

            await role.edit({
                icon: image,
                mentionable: true
            });

            const embed = new EmbedBuilder()
                .setTitle('Role Icon Updated')
                .setDescription(`Icon has been set for the role **${role.name}**`)
                .setThumbnail(`attachment://${iconAttachment.name}`)
                .setColor(role.color);

            await interaction.reply({ 
                content: `Icon set for role **${role.name}**.`,
                embeds: [embed],
                files: [{ attachment: image, name: iconAttachment.name }]
            });
        } catch (error) {
            console.error(error);
            await interaction.reply('An error occurred while setting the role icon.');
        }
};
