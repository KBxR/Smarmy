const { SlashCommandSubcommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const { getBotInfo, getRandomHexColor } = require('@utils');

module.exports.data = new SlashCommandSubcommandBuilder()
    .setName('create')
    .setDescription('Creates a role with given hex code')
    .addStringOption(option =>
        option.setName('rolename')
            .setDescription('Name of the role to create')
            .setRequired(true))
    .addStringOption(option =>
        option.setName('hexcode')
            .setDescription('Hex color code (Defaults to a random color)'))
    .addAttachmentOption(option =>
        option.setName('icon')
            .setDescription('The icon image file (optional)'));

module.exports.execute = async function handleRoleCreate(interaction) {
    const name = interaction.options.getString('rolename');
    let color = interaction.options.getString('hexcode');
    const roleIcon = interaction.options.getAttachment('icon');

    if (!color) {
        color = getRandomHexColor().slice(1);
    }

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
