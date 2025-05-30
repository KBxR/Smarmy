const { SlashCommandSubcommandBuilder, EmbedBuilder } = require('discord.js');
const { catKey, databasePath } = require('@config');
const { getRandomHexColor } = require('@utils');
const { fetchCatPicture } = require('@api/catApi');
const { Client } = require('pg');
const { UserInfo } = require('@database/setup');
const { format } = require('date-fns');

const client = new Client({
    connectionString: `${databasePath}`,
});

client.connect();

module.exports = {
    data: new SlashCommandSubcommandBuilder()
        .setName('daily')
        .setDescription('Get a daily cat picture'),
    async execute(interaction) {
        const userId = interaction.options.getUser('member')?.id || interaction.user.id;
        
            const lastCatRes = await client.query(`
                SELECT fetched_at, picture_url
                FROM cat_pictures
                WHERE user_id = $1
                ORDER BY fetched_at DESC
                LIMIT 1
            `, [userId]); 

            if (lastCatRes.rowCount > 0) {
                const lastFetchedAt = new Date(lastCatRes.rows[0].fetched_at);
                const lastPictureUrl = lastCatRes.rows[0].picture_url;
                const now = new Date();
                const hoursSinceLastFetch = (now - lastFetchedAt) / (1000 * 60 * 60);
                const oneDayLater = new Date(lastFetchedAt.getTime() + 24 * 60 * 60 * 1000);
                const oneDayLaterEpoch = Math.floor(oneDayLater.getTime() / 1000);
            
                if (hoursSinceLastFetch < 24 && lastPictureUrl && !lastPictureUrl.includes('imgur.com')) {
                    await interaction.reply({ content: `You can only fetch a new cat picture once every 24 hours. You can get another cat at <t:${oneDayLaterEpoch}:F>`, ephemeral: true });
                    return;
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

        // Update dailycat.lastcat to the current date
        const currentDate = format(new Date(), 'dd-MM-yyyy');
        let userInfo = await UserInfo.findOne({ where: { user_id: userId } });
        if (userInfo) {
            const updatedInfo = {
                ...userInfo.info,
                dailycat: {
                    ...userInfo.info.dailycat,
                    lastcat: currentDate,
                    cats: (userInfo.info.dailycat.cats || 0) + 1,
                    catBucks: (userInfo.info.dailycat.catBucks || 0) + 1
                }
            };
            await UserInfo.update({ info: updatedInfo }, { where: { user_id: userId } });
        }

        const embed = new EmbedBuilder()
            .setColor(randomColor)
            .setTitle('Here is your daily cat picture! 🐱')
            .setDescription('You can get a new cat picture in 24 hours.')
            .setImage(pictureUrl)
            .setFooter({ text: `Cat ID: ${catId} • You got a Cat Buck!` })
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: false });
    }
};