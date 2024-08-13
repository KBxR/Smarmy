const { SlashCommandSubcommandBuilder, EmbedBuilder } = require('discord.js');
const getServerConfig = require('@utils/getServerConfig');

module.exports.data = new SlashCommandSubcommandBuilder()
    .setName('view')
    .setDescription('View the current configuration');

module.exports.execute = async function handleViewConfig(interaction) {
    const serverId = interaction.guild.id; // Use the current server ID
    const config = await getServerConfig(serverId);

    if (!config) {
        await interaction.reply('No configuration found for this server.');
        return;
    }

    const embed = new EmbedBuilder()
        .setTitle('Current Configuration')
        .setDescription('Here is the current configuration for this server:')
        .setColor(0x00AE86)
        .setThumbnail(interaction.guild.iconURL()) // Add server icon as thumbnail
        .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
        .setTimestamp();

    // Add a divider line
    embed.addFields({ name: '\u200B', value: '━━━━━━━━━━━━━━━━━━━━', inline: false });

    for (const [key, value] of Object.entries(config)) {
        embed.addFields({ name: `🔧 ${key}`, value: `\`\`\`json\n${JSON.stringify(value, null, 2)}\n\`\`\``, inline: false });
    }

    // Add another divider line
    embed.addFields({ name: '\u200B', value: '━━━━━━━━━━━━━━━━━━━━', inline: false });

    await interaction.reply({ embeds: [embed], ephemeral: true });
};