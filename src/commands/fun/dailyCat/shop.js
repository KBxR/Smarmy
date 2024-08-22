const { SlashCommandSubcommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const { databasePath } = require('@config');
const { Client } = require('pg');
const { UserInfo } = require('@database/setup');
const { format } = require('date-fns');

const client = new Client({
    connectionString: `${databasePath}`,
});

client.connect();

let catCache = {
    cats: [],
    lastUpdated: null
};

// Function to fetch new cats and update the cache
async function refreshCatCache() {
    try {
        const res = await client.query('SELECT * FROM cat_store ORDER BY RANDOM() LIMIT 5');
        catCache.cats = res.rows;
        catCache.lastUpdated = new Date();
    } catch (error) {
        console.error('Error fetching cats from the database:', error);
    }
}
    
module.exports = {
    data: new SlashCommandSubcommandBuilder()
        .setName('shop')
        .setDescription('Fetch today\'s cat shop'),
    async execute(interaction) {
        try {
            const cats = catCache.cats;

            if (cats.length === 0) {
                return interaction.reply({ content: 'No cats available in the shop.', ephemeral: true });
            }

            let currentIndex = 0;

            const generateEmbed = (index) => {
                const cat = cats[index];
                return new EmbedBuilder()
                    .setTitle('Today\'s Cat Shop')
                    .setColor('#FF4500')
                    .setTimestamp()
                    .setImage(cat.picture_url)
                    .addFields({
                        name: `Cat Shop ID: ${cat.id}`,
                        value: `Price: ₡${cat.price}`,
                        inline: true
                    });
            };

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('previous')
                        .setLabel('Previous')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(currentIndex === 0), // Disable if at the first cat
                    new ButtonBuilder()
                        .setCustomId('next')
                        .setLabel('Next')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(currentIndex === cats.length - 1), // Disable if at the last cat
                    new ButtonBuilder()
                        .setCustomId('buy')
                        .setLabel('Buy')
                        .setStyle(ButtonStyle.Success)
                );

            const embed = generateEmbed(currentIndex);

            const message = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });

            const filter = i => i.customId === 'previous' || i.customId === 'next' || i.customId === 'buy';
            const collector = message.createMessageComponentCollector({ filter, componentType: ComponentType.Button, time: 60000 });

            collector.on('collect', async i => {
                if (i.customId === 'previous') {
                    currentIndex = Math.max(0, currentIndex - 1); // Prevent going below 0
                } else if (i.customId === 'next') {
                    currentIndex = Math.min(cats.length - 1, currentIndex + 1); // Prevent going above the last index
                } else if (i.customId === 'buy') {
                    const cat = cats[currentIndex];
                    const userId = i.user.id;

                    // Fetch user info
                    let userInfo = await UserInfo.findOne({ where: { user_id: userId } });
                    if (!userInfo) {
                        return i.reply({ content: 'User info not found.', ephemeral: true });
                    }

                    const userCatBucks = userInfo.info.dailycat.catBucks;

                    if (userCatBucks < cat.price) {
                        return i.reply({ content: 'You do not have enough Cat Bucks to buy this cat.', ephemeral: true });
                    }

                    // Deduct the price from user's Cat Bucks
                    const updatedInfo = {
                        ...userInfo.info,
                        dailycat: {
                            ...userInfo.info.dailycat,
                            catBucks: userCatBucks - cat.price
                        }
                    };

                    await UserInfo.update({ info: updatedInfo }, { where: { user_id: userId } });

                    // Insert the bought cat into the cat_pictures table
                    const insertRes = await client.query(`
                    INSERT INTO cat_pictures (user_id, picture_url, fetched_at)
                    VALUES ($1, $2, NOW())
                    RETURNING id
                `, [userId, cat.picture_url]);

                    const catId = insertRes.rows[0].id;

                    // Update dailycat.lastcat to the current date
                    const currentDate = format(new Date(), 'dd-MM-yyyy');
                    const updatedInfoWithCat = {
                        ...updatedInfo,
                        dailycat: {
                            ...updatedInfo.dailycat,
                            lastcat: currentDate,
                            cats: (updatedInfo.dailycat.cats || 0) + 1
                        }
                    };

                    await UserInfo.update({ info: updatedInfoWithCat }, { where: { user_id: userId } });

                    // Remove the bought cat from the array
                    catCache.cats = catCache.cats.filter(c => c.id !== cat.id);

                    const embed = new EmbedBuilder()
                        .setColor('#FF4500')
                        .setTitle('You bought a cat! 🐱')
                        .setDescription(`You have successfully bought the cat with ID: ${cat.id} for ₡${cat.price}.`)
                        .setImage(cat.picture_url)
                        .setFooter({ text: `Cat ID: ${catId}` })
                        .setTimestamp();

                    return i.reply({ embeds: [embed], ephemeral: false });
                }

                // Update the buttons' disabled state
                const updatedRow = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('previous')
                            .setLabel('Previous')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(currentIndex === 0),
                        new ButtonBuilder()
                            .setCustomId('next')
                            .setLabel('Next')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(currentIndex === cats.length - 1),
                        new ButtonBuilder()
                            .setCustomId('buy')
                            .setLabel('Buy')
                            .setStyle(ButtonStyle.Success)
                    );

                await i.update({ embeds: [generateEmbed(currentIndex)], components: [updatedRow] });
            });

            collector.on('end', collected => {
                message.edit({ components: [] });
            });
        } catch (error) {
            console.error('Error fetching cats from the database:', error);
            await interaction.reply({ content: 'An error occurred while fetching the cat shop.', ephemeral: true });
        }
    },
    refreshCatCache
};