const { SlashCommandSubcommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { databasePath } = require('@config');
const { Client } = require('pg');

const client = new Client({
    connectionString: `${databasePath}`,
});

client.connect();

module.exports = {
    data: new SlashCommandSubcommandBuilder()
        .setName('history')
        .setDescription('View your fetched cat pictures')
        .addUserOption(option => 
            option.setName('member')
                .setDescription('The member whose history you want to view')
                .setRequired(false)),
    async execute(interaction) {

        const userId = interaction.options.getUser('member')?.id || interaction.user.id;

        const res = await client.query(`
            SELECT id, picture_url, fetched_at
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
                    .setImage(picture.picture_url)
                    .setFooter({ text: `Cat ID: ${picture.id}` });
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

            const message = await interaction.reply({ embeds: [generateEmbed(currentIndex)], components: [row], ephemeral: false });

            const filter = i => i.customId === 'prev' || i.customId === 'next';
            const collector = message.createMessageComponentCollector({ filter, time: 60000 });

            collector.on('collect', async i => {
                if (i.customId === 'prev') {
                    currentIndex--;
                } else if (i.customId === 'next') {
                    currentIndex++;
                }

                await i.update({ embeds: [generateEmbed(currentIndex)], components: [row] });
            });

            collector.on('end', collected => {
                if (collected.size === 0) {
                    message.edit({ components: [] });
                }
            });
        }
    }
};