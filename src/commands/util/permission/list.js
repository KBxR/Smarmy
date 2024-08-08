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

    // Iterate over each category in the permissions data
    for (const category in permissionsData) {
        if (permissionsData.hasOwnProperty(category)) {
            const categoryDescription = permissionsData[category][0];
            embed.addFields({ name: category.charAt(0).toUpperCase() + category.slice(1), value: categoryDescription, inline: false });

            permissionsData[category].slice(1).forEach(permission => {
                embed.addFields({ name: permission.name, value: permission.description, inline: true });
            });
        }
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
};