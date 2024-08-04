const { databasePath } = require('@config');
const { Client } = require('pg');
const { SlashCommandSubcommandBuilder, EmbedBuilder } = require('discord.js');
const permissionsData = require('../permissions.json');

const client = new Client({
    connectionString: `${databasePath}`,
});

client.connect();

module.exports.data = new SlashCommandSubcommandBuilder()
    .setName('check')
    .setDescription('Check who has what permissions')
    .addStringOption(option =>
        option.setName('permission')
            .setDescription('The permission to search for')
            .setRequired(false))
    .addUserOption(option =>
        option.setName('user')
            .setDescription('The user to search for')
            .setRequired(false));

module.exports.execute = async function handlePermissionCheck(interaction) {
    const serverId = interaction.guild.id;
    const permission = interaction.options.getString('permission');
    const user = interaction.options.getUser('user');

    let query = `
        SELECT user_id, permission_name
        FROM permissions
        WHERE server_id = $1
    `;
    const queryParams = [serverId];

    if (permission) {
        query += ' AND permission_name = $2';
        queryParams.push(permission);
    } else if (user) {
        query += ' AND user_id = $2';
        queryParams.push(user.id);
    }

    client.query(query, queryParams, async (err, res) => {
        if (err) {
            console.error(err);
            await interaction.reply({ content: 'Failed to fetch permissions.', ephemeral: true });
        } else {
            const embed = new EmbedBuilder()
                .setTitle('User Permissions')
                .setColor(0x00AE86);

            if (res.rows.length === 0) {
                embed.setDescription('No permissions found.');
            } else {
                if (user) {
                    embed.setAuthor({ name: user.tag, iconURL: user.displayAvatarURL() });
                }

                if (permission) {
                    const usernames = await Promise.all(res.rows.map(async row => {
                        const member = await interaction.guild.members.fetch(row.user_id);
                        return member.user.username;
                    }));
                    embed.setDescription(usernames.join('\n'));
                } else {
                    res.rows.forEach(row => {
                        const permissionInfo = permissionsData.permissions.find(p => p.name === row.permission_name);
                        const description = permissionInfo ? permissionInfo.description : 'No description available';
                        embed.addFields({ name: row.permission_name, value: description, inline: true });
                    });
                }
            }

            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    });
};