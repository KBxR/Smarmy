const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { catKey, databasePath, adminId } = require('@config');
const { fetchCatPicture } = require('@api/catApi');
const { Client } = require('pg');

const client = new Client({
    connectionString: `${databasePath}`,
});

client.connect();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dailycat')
        .setDescription('Fetch today\'s cat picture')
        .addSubcommand(subcommand =>
            subcommand
                .setName('get')
                .setDescription('Fetch today\'s cat picture'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('history')
                .setDescription('View your fetched cat pictures')
                .addUserOption(option => 
                    option.setName('member')
                          .setDescription('The member whose history you want to view')
                          .setRequired(false))),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const userId = interaction.options.getUser('member')?.id || interaction.user.id;

        if (subcommand === 'get') {

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
                    const hoursSinceLastFetch = (now - lastFetchedAt) / (1000 * 60 * 60);

                    if (hoursSinceLastFetch < 24) {
                        await interaction.reply({ content: 'You can only fetch a new cat picture once every 24 hours.', ephemeral: true });
                        return;
                    }
                }
            }

            const pictureUrl = await fetchCatPicture(catKey);

            await client.query(`
                INSERT INTO cat_pictures (user_id, picture_url, fetched_at)
                VALUES ($1, $2, NOW())
            `, [userId, pictureUrl]);

            const embed = new EmbedBuilder()
                .setTitle('Here is your daily cat picture! 🐱')
                .setImage(pictureUrl);

            await interaction.reply({ embeds: [embed], ephemeral: false });
        } else if (subcommand === 'history') {
            const res = await client.query(`
                SELECT picture_url, fetched_at
                FROM cat_pictures
                WHERE user_id = $1
                ORDER BY fetched_at DESC
            `, [userId]);

            if (res.rowCount === 0) {
                await interaction.reply({ content: 'No cat pictures found for this user.', ephemeral: true });
            } else {
                let currentIndex = 0;
                const pictures = res.rows;

                const generateEmbed = (index) => {
                    const picture = pictures[index];
                    return new EmbedBuilder()
                        .setTitle(`Cat Picture ${index + 1} of ${pictures.length}`)
                        .setDescription(`Fetched on: ${new Date(picture.fetched_at).toLocaleDateString()}`)
                        .setImage(picture.picture_url);
                };

                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('prev')
                            .setLabel('Previous')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(currentIndex === 0),
                        new ButtonBuilder()
                            .setCustomId('next')
                            .setLabel('Next')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(currentIndex === pictures.length - 1)
                    );

                const message = await interaction.reply({ embeds: [generateEmbed(currentIndex)], components: [row], ephemeral: false, fetchReply: true });

                const filter = i => i.user.id === interaction.user.id;
                const collector = message.createMessageComponentCollector({ filter, time: 60000 });

                collector.on('collect', async i => {
                    if (i.customId === 'prev') {
                        currentIndex--;
                    } else if (i.customId === 'next') {
                        currentIndex++;
                    }

                    await i.update({ embeds: [generateEmbed(currentIndex)], components: [new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('prev')
                                .setLabel('Previous')
                                .setStyle(ButtonStyle.Primary)
                                .setDisabled(currentIndex === 0),
                            new ButtonBuilder()
                                .setCustomId('next')
                                .setLabel('Next')
                                .setStyle(ButtonStyle.Primary)
                                .setDisabled(currentIndex === pictures.length - 1)
                        )
                    ]});
                });

                collector.on('end', collected => {
                    message.edit({ components: [] });
                });
            }
        }
    }
};