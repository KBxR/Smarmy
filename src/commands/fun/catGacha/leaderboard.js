const { SlashCommandSubcommandBuilder, EmbedBuilder } = require('discord.js');
const { databasePath } = require('@config');
const { getRandomHexColor } = require('@utils');
const { Client } = require('pg');

const client = new Client({
    connectionString: `${databasePath}`,
});

client.connect();

module.exports = {
    data: new SlashCommandSubcommandBuilder()
        .setName('leaderboard')
        .setDescription('Get the Cat Gacha Cat leaderboard')
        .addStringOption(option =>
            option.setName('range')
                .setDescription('The range of the leaderboard')
                .setRequired(true)
                .addChoices(
                    { name: 'Global', value: 'global' },
                    { name: 'Server', value: 'server' }
                )
        )
        .addStringOption(option =>
            option.setName('type')
                .setDescription('The type of leaderboard')
                .setRequired(true)
                .addChoices(
                    { name: 'Cats', value: 'cats' },
                    { name: 'Catbucks', value: 'catbucks' }
                )
        ),

    async execute(interaction) {
        const range = interaction.options.getString('range');
        const type = interaction.options.getString('type');
        let query = '';
        let params = [];

        const column = type === 'cats' ? 'cats' : 'catBucks';

        if (range === 'global') {
            query = `
                SELECT user_id, info->'dailycat'->>'${column}' AS count
                FROM user_info
                WHERE user_id NOT IN (SELECT user_id FROM blacklist WHERE server_id IS NULL)
                ORDER BY (info->'dailycat'->>'${column}')::int DESC
                LIMIT 10
            `;
        } else if (range === 'server') {
            const serverId = interaction.guild.id;
            const serverConfigQuery = `
                SELECT config->'users' AS users
                FROM server_config
                WHERE server_id = $1
            `;
            const serverConfigRes = await client.query(serverConfigQuery, [serverId]);
            const userIds = serverConfigRes.rows[0]?.users || [];

            if (userIds.length === 0) {
                return interaction.reply({ content: 'No users found for this server.', ephemeral: true });
            }

            query = `
                SELECT user_id, info->'dailycat'->>'${column}' AS count
                FROM user_info
                WHERE user_id = ANY($1)
                AND user_id NOT IN (SELECT user_id FROM blacklist WHERE server_id = $2)
                ORDER BY (info->'dailycat'->>'${column}')::int DESC
                LIMIT 10
            `;
            params = [userIds, serverId];
        }

        try {
            const res = await client.query(query, params);
            const leaderboard = res.rows;

            if (leaderboard.length === 0) {
                return interaction.reply({ content: 'No data found for the leaderboard.', ephemeral: true });
            }

            const embed = new EmbedBuilder()
                .setColor(getRandomHexColor())
                .setTitle(`${range.charAt(0).toUpperCase() + range.slice(1)} Leaderboard (${type.charAt(0).toUpperCase() + type.slice(1)})`)
                .setTimestamp();

            for (const [index, user] of leaderboard.entries()) {
                const discordUser = await interaction.client.users.fetch(user.user_id);
                let medal = '';
                if (index === 0) medal = '🥇';
                else if (index === 1) medal = '🥈';
                else if (index === 2) medal = '🥉';

                const name = medal ? `${medal} ${discordUser.username}` : `#${index + 1} ${discordUser.username}`;
                embed.addFields({ name, value: `${type.charAt(0).toUpperCase() + type.slice(1)}: ${user.count}`, inline: false });
            }

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
            await interaction.reply({ content: 'An error occurred while fetching the leaderboard. Please try again later.', ephemeral: true });
        }
    }
};