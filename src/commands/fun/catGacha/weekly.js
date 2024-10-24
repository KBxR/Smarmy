const { SlashCommandSubcommandBuilder, EmbedBuilder } = require('discord.js');
const { catKey } = require('@config');
const { UserInfo } = require('@database/setup');
const { CodeUsage, Codes, CatPicture } = require('@database/models');
const { fetchCatPicture } = require('@api/catApi');
const { format } = require('date-fns');

module.exports = {
    data: new SlashCommandSubcommandBuilder()
        .setName('weekly')
        .setDescription('Redeem your weekly cat gift'),
    async execute(interaction) {
        const userId = interaction.user.id;
        const code = 'weekly';

        try {
            const gift = await Codes.findOne({ where: { code } });

            if (!gift) {
                return interaction.reply({ content: 'Invalid code.', ephemeral: true });
            }

            const embed = new EmbedBuilder()
                .setTitle('Weekly Cat Redeemed')
                .setColor(0x00FF00);

            const now = new Date();

            const lastUsed = await CodeUsage.findOne({
                where: { user_id: userId, code },
                order: [['used_at', 'DESC']]
            });

            if (lastUsed) {
                const lastUsedDate = new Date(lastUsed.used_at);
                const oneWeekLater = new Date(lastUsedDate);
                oneWeekLater.setDate(lastUsedDate.getDate() + 7);
            
                if (now < oneWeekLater) {
                    const oneWeekLaterEpoch = Math.floor(oneWeekLater.getTime() / 1000);
                    return interaction.reply({ content: `You can only use this code once a week. You can use it again at <t:${oneWeekLaterEpoch}:F>.`, ephemeral: true });
                }
            }

            if (gift.value.catbucks) {
                const codeCatBucks = gift.value.catbucks;
                let userInfo = await UserInfo.findOne({ where: { user_id: userId } });
                if (!userInfo) {
                    userInfo = await UserInfo.create({ user_id: userId, info: { dailycat: { catBucks: 0, cats: 0, lastcat: '' } } });
                }

                const updatedInfo = {
                    ...userInfo.info,
                    dailycat: {
                        ...userInfo.info.dailycat,
                        catBucks: (userInfo.info.dailycat.catBucks || 0) + codeCatBucks
                    }
                };

                await UserInfo.update({ info: updatedInfo }, { where: { user_id: userId } });

                embed.addFields({ name: 'Cat Bucks', value: `You have received ${codeCatBucks} Cat Bucks!` });
            }

            if (gift.value.cat) {
                const pictureUrl = await fetchCatPicture(catKey);

                // Use the CatPicture model to insert the new cat picture
                const insertRes = await CatPicture.create({
                    user_id: userId,
                    picture_url: pictureUrl,
                    fetched_at: new Date()
                });

                const catId = insertRes.id;

                // Update dailycat.lastcat to the current date
                const currentDate = format(new Date(), 'dd-MM-yyyy');
                let userInfo = await UserInfo.findOne({ where: { user_id: userId } });
                if (userInfo) {
                    const updatedInfo = {
                        ...userInfo.info,
                        dailycat: {
                            ...userInfo.info.dailycat,
                            lastcat: currentDate,
                            cats: (userInfo.info.dailycat.cats || 0) + 1
                        }
                    };
                    await UserInfo.update({ info: updatedInfo }, { where: { user_id: userId } });
                }

                embed.addFields({ name: 'Cat Picture', value: `You have received a cat picture!` })
                    .setImage(pictureUrl)
                    .setFooter({ text: `Cat ID: ${catId}` });
            }

            // Log code usage only if the gift was successfully redeemed
            await CodeUsage.create({ user_id: userId, code, used_at: now });

            interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error querying the database:', error);
            interaction.reply({ content: 'An error occurred while checking the code.', ephemeral: true });
        }
    }
};