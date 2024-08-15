const { SlashCommandSubcommandBuilder, EmbedBuilder } = require('discord.js');
const { catKey, databasePath, adminId } = require('@config');
const { getRandomHexColor } = require('@utils');
const { fetchCatPicture } = require('@api/catApi');
const { Client } = require('pg');

const client = new Client({
    connectionString: `${databasePath}`,
});

client.connect();

module.exports = {
    data: new SlashCommandSubcommandBuilder()
        .setName('claim')
        .setDescription('Fetch today\'s cat picture'),
    async execute(interaction) {
        const userId = interaction.options.getUser('member')?.id || interaction.user.id;
        
        if (userId !== adminId) {
            const lastCatRes = await client.query(`
                SELECT fetched_at
                FROM cat_pictures
                WHERE user_id = $1
                ORDER BY fetched_at DESC
                LIMIT 1
            `, [userId]);
        
            if (lastCatRes.rowCount > 0) {
                const lastFetchedAt = new Date(lastCatRes.rows[0].fetched_at);
                const now = new Date();
        
                // Check if the last fetched date is today
                const lastFetchedDay = lastFetchedAt.getUTCDate();
                const lastFetchedMonth = lastFetchedAt.getUTCMonth();
                const lastFetchedYear = lastFetchedAt.getUTCFullYear();
        
                const currentDay = now.getUTCDate();
                const currentMonth = now.getUTCMonth();
                const currentYear = now.getUTCFullYear();
        
                if (lastFetchedDay === currentDay && lastFetchedMonth === currentMonth && lastFetchedYear === currentYear) {
                    await interaction.reply({ content: 'You can only fetch a new cat picture once per day. Please try again tomorrow.', ephemeral: true });
                    return;
                }
            }
        }
        
        const pictureUrl = await fetchCatPicture(catKey);
        
        const insertRes = await client.query(`
            INSERT INTO cat_pictures (user_id, picture_url, fetched_at)
            VALUES ($1, $2, NOW())
            RETURNING id
        `, [userId, pictureUrl]);
        
        const catId = insertRes.rows[0].id;
        
        const randomColor = getRandomHexColor();
        
        const embed = new EmbedBuilder()
            .setColor(randomColor)
            .setTitle('Here is your daily cat picture! 🐱')
            .setDescription('You can get a new cat picture tomorrow.')
            .setImage(pictureUrl)
            .setFooter({ text: `Cat ID: ${catId}`})
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed], ephemeral: false });
    }
};