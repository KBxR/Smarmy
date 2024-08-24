const { SlashCommandSubcommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { databasePath } = require('@config');
const { Client } = require('pg');
const { format } = require('date-fns');
const { UserInfo } = require('@database/setup');

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
            return;
        }

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
            const actionRow = new ActionRowBuilder()
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
                        .setDisabled(currentIndex > pictures.length - 11),
                );

                if (userId === interaction.user.id) {
                    actionRow.addComponents(
                        new ButtonBuilder()
                            .setCustomId('sell')
                            .setLabel('Sell')
                            .setStyle(ButtonStyle.Danger)
                    );
                }
                return actionRow;
        };

        

        const message = await interaction.reply({ embeds: [generateEmbed(currentIndex)], components: [createActionRow(currentIndex)], ephemeral: false });

        const filter = i => ['prev', 'next', 'prev10', 'next10', 'sell'].includes(i.customId) && i.user.id === interaction.user.id;
        const collector = message.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async i => {
            if (i.customId === 'prev') {
                currentIndex--;
                if (currentIndex < 0) currentIndex = pictures.length - 1;
                await i.update({ embeds: [generateEmbed(currentIndex)], components: [createActionRow(currentIndex)] });
            } else if (i.customId === 'next') {
                currentIndex++;
                if (currentIndex >= pictures.length) currentIndex = 0;
                await i.update({ embeds: [generateEmbed(currentIndex)], components: [createActionRow(currentIndex)] });
            } else if (i.customId === 'prev10') {
                currentIndex -= 10;
                if (currentIndex < 0) currentIndex = 0;
                await i.update({ embeds: [generateEmbed(currentIndex)], components: [createActionRow(currentIndex)] });
            } else if (i.customId === 'next10') {
                currentIndex += 10;
                if (currentIndex >= pictures.length) currentIndex = pictures.length - 1;
                await i.update({ embeds: [generateEmbed(currentIndex)], components: [createActionRow(currentIndex)] });
            } else if (i.customId === 'sell') {
                collector.stop();
                const picture = pictures[currentIndex];
                let price = 3; // Default price

                if (picture.picture_url.includes('imgur.com')) {
                    try {
                        const storeRes = await client.query(`
                            SELECT price
                            FROM cat_store
                            WHERE picture_url = $1
                        `, [picture.picture_url]);

                        if (storeRes.rowCount > 0) {
                            const storePrice = parseFloat(storeRes.rows[0].price);
                            if (storePrice) {
                                price = Math.ceil(storePrice / 2);
                            } else {
                                await i.reply({ content: 'Invalid price value in store.', components: [], ephemeral: true });
                                return;
                            }
                        } else {
                            await i.reply({ content: 'This cat cannot be sold.', components: [], ephemeral: true });
                            return;
                        }
                    } catch (error) {
                        console.error('Failed to fetch cat value from store:', error);
                        await i.reply({ content: 'An error occurred while fetching the cat value.', ephemeral: true });
                        return;
                    }
                }

                const confirmationEmbed = new EmbedBuilder()
                    .setTitle('Confirm Sale')
                    .setDescription(`Are you sure you want to sell this cat for ${price} Cat Bucks?`)
                    .setImage(picture.picture_url)
                    .setFooter({ text: 'You can confirm in 5 seconds.' });

                await i.reply({ embeds: [confirmationEmbed], components: [] });

                setTimeout(async () => {
                    const confirmationRow = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('confirm_sell')
                                .setLabel('Confirm')
                                .setStyle(ButtonStyle.Danger),
                            new ButtonBuilder()
                                .setCustomId('cancel_sell')
                                .setLabel('Cancel')
                                .setStyle(ButtonStyle.Secondary)
                        );

                    try {
                        await i.editReply({ components: [confirmationRow] });
                    } catch (error) {
                        console.error('Failed to send follow-up message:', error);
                        return;
                    }

                    const confirmationFilter = btn => (btn.customId === 'confirm_sell' || btn.customId === 'cancel_sell') && btn.user.id === i.user.id;
                    const confirmationCollector = i.channel.createMessageComponentCollector({ filter: confirmationFilter, time: 30000 });

                    confirmationCollector.on('collect', async btn => {
                        if (btn.customId === 'confirm_sell') {
                            try {
                                await client.query(`
                                    DELETE FROM cat_pictures
                                    WHERE id = $1
                                `, [picture.id]);
                    
                                // Update dailycat.catBucks in UserInfo
                                let userInfo = await UserInfo.findOne({ where: { user_id: i.user.id } });
                                if (userInfo) {
                                    const updatedInfo = {
                                        ...userInfo.info,
                                        dailycat: {
                                            ...userInfo.info.dailycat,
                                            catBucks: (userInfo.info.dailycat.catBucks || 0) + price
                                        }
                                    };
                                    await UserInfo.update({ info: updatedInfo }, { where: { user_id: i.user.id } });
                                }
                    
                                const saleEmbed = new EmbedBuilder()
                                    .setTitle('Cat sold successfully!')
                                    .setDescription(`You have received ${price} Cat Bucks.`);
                    
                                await btn.update({ embeds: [saleEmbed], components: [], ephemeral: false });
                            } catch (error) {
                                console.error('Failed to complete sale:', error);
                                await btn.update({ content: 'An error occurred while completing the sale.', components: [], ephemeral: true });
                            }
                        } else if (btn.customId === 'cancel_sell') {
                            await btn.update({ content: 'Sale cancelled.', components: [], embeds: [] });
                        }
                    });

                    // Timeout the confirmation collector if no response is received
                    confirmationCollector.on('end', async collected => {
                        if (collected.size === 0) {
                            await i.editReply({ content: 'Sale cancelled due to inactivity.', components: [], embeds: [] });
                        }
                    });
                }, 5000);
            }
        });
        collector.on('end', async collected => {
            await message.edit({ components: [] });
        });
    }
};