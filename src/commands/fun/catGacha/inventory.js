const { SlashCommandSubcommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { databasePath } = require('@config');
const { Client } = require('pg');
const { format } = require('date-fns');

const client = new Client({
    connectionString: `${databasePath}`,
});

client.connect();

module.exports = {
    data: new SlashCommandSubcommandBuilder()
        .setName('inventory')
        .setDescription('View your cat picture inventory')
        .addUserOption(option => 
            option.setName('member')
                .setDescription('The member whose inventory you want to view')
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
                    .setDescription(`Fetched on: ${format(new Date(picture.fetched_at), 'dd-MM-yyyy')}`)
                    .setImage(picture.picture_url)
                    .setFooter({ text: `Cat ID: ${picture.id}` });
            };
            
            const createActionRow = (currentIndex) => {
                return new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('prev10')
                            .setLabel('Previous 10')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(currentIndex < 10),
                        new ButtonBuilder()
                            .setCustomId('prev')
                            .setLabel('Previous')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(currentIndex === 0),
                        new ButtonBuilder()
                            .setCustomId('next')
                            .setLabel('Next')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(currentIndex === pictures.length - 1),
                        new ButtonBuilder()
                            .setCustomId('next10')
                            .setLabel('Next 10')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(currentIndex > pictures.length - 11)
                    );
            };
            
            const message = await interaction.reply({ embeds: [generateEmbed(currentIndex)], components: [createActionRow(currentIndex)], ephemeral: false });
            
            const filter = i => ['prev', 'next', 'prev10', 'next10'].includes(i.customId);
            const collector = message.createMessageComponentCollector({ filter, time: 60000 });
            
            collector.on('collect', async i => {
                if (i.customId === 'prev') {
                    currentIndex--;
                } else if (i.customId === 'next') {
                    currentIndex++;
                } else if (i.customId === 'prev10') {
                    currentIndex -= 10;
                    if (currentIndex < 0) currentIndex = 0;
                } else if (i.customId === 'next10') {
                    currentIndex += 10;
                    if (currentIndex >= pictures.length) currentIndex = pictures.length - 1;
                }
            
                await i.update({ embeds: [generateEmbed(currentIndex)], components: [createActionRow(currentIndex)] });
            });
            
            collector.on('end', async collected => {
                if (collected.size === 0) {
                    await message.edit({ components: [] });
                } else {
                    await message.edit({ components: [] });
                }
            });
        }
    }
};