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
        ),

    async execute(interaction) {
        const range = interaction.options.getString('range');
        let query = '';
        let params = [];

        if (range === 'global') {
            query = `
                SELECT user_id, info->'dailycat'->>'cats' AS cat_count
                FROM user_info
                ORDER BY (info->'dailycat'->>'cats')::int DESC
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
            SELECT user_id, info->'dailycat'->>'cats' AS cat_count
            FROM user_info
            WHERE user_id = ANY($1)
            ORDER BY (info->'dailycat'->>'cats')::int DESC
            LIMIT 10
        `;
        params = [userIds];
    }

        try {
            const res = await client.query(query, params);
            const leaderboard = res.rows;

            if (leaderboard.length === 0) {
                return interaction.reply({ content: 'No data found for the leaderboard.', ephemeral: true });
            }

            const embed = new EmbedBuilder()
                .setColor(getRandomHexColor())
                .setTitle(`${range.charAt(0).toUpperCase() + range.slice(1)} Leaderboard`)
                .setTimestamp();

            for (const [index, user] of leaderboard.entries()) {
                const discordUser = await interaction.client.users.fetch(user.user_id);
                embed.addFields({ name: `#${index + 1} ${discordUser.username}`, value: `Cats: ${user.cat_count}`, inline: false });
            }

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
            await interaction.reply({ content: 'An error occurred while fetching the leaderboard. Please try again later.', ephemeral: true });
        }
    }
};