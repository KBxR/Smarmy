const { SlashCommandSubcommandBuilder, EmbedBuilder } = require('discord.js');
const { Client } = require('pg');
const { databasePath } = require('@config');
const permissionsData = require('../permissions.json');

const client = new Client({
    connectionString: `${databasePath}`,
});

client.connect();

module.exports.data = new SlashCommandSubcommandBuilder()
    .setName('list')
    .setDescription('List all available permissions');

module.exports.execute = async function handlePermissionList(interaction) {
    const embed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle('Available Permissions')
        .setTimestamp()
        .setFooter({ text: 'Permissions List' });

    permissionsData.permissions.forEach(permission => {
        embed.addFields({ name: permission.name, value: permission.description });
    });

    await interaction.reply({ embeds: [embed], ephemeral: true });
};