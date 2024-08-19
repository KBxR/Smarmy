const { UserInfo } = require('@database/setup');
const { CatPicture } = require('@database/models');
const { SlashCommandSubcommandBuilder, EmbedBuilder } = require('discord.js');
const { getRandomHexColor } = require('@utils');

module.exports = {
    data: new SlashCommandSubcommandBuilder()
        .setName('info')
        .setDescription('Get a user\'s cat info.'),

    async execute(interaction) {
        const userID = interaction.user.id;

        try {
            let user = await UserInfo.findByPk(userID);

            if (!user.info.dailycat) {
                return interaction.reply({ content: 'No cat information found for this user.', ephemeral: true });
            }

            const dailyCatInfo = user.info.dailycat;
            const { cats, lastcat, favorite, catBucks } = dailyCatInfo;

            const randomColor = getRandomHexColor();

            const embed = new EmbedBuilder()
                .setColor(randomColor)
                .setTitle(`${interaction.user.username}'s Cat Info`)
                .addFields(
                    { name: 'Total Cats', value: `${cats.toString()}`, inline: true },
                    { name: 'Last Cat Date', value: `${lastcat}`, inline: true },
                    { name: 'Cat Bucks', value: `${catBucks}`, inline: true }
                );

            // Check if favorite cat ID is greater than 0 and fetch the favorite cat picture if it exists
            if (favorite && favorite > 0) {
                const favoriteCatPicture = await CatPicture.findByPk(favorite);
                if (favoriteCatPicture) {
                    embed.addFields(
                        { name: 'Favorite Cat', value: `${favorite}`, inline: true }
                    );
                    embed.setImage(favoriteCatPicture.picture_url);
                } else {
                    embed.addFields(
                        { name: 'Favorite Cat', value: 'None', inline: true }
                    );
                }
            } else {
                embed.addFields(
                    { name: 'Favorite Cat', value: 'None', inline: true }
                );
            }

            return interaction.reply({ embeds: [embed], ephemeral: false });
        } catch (error) {
            console.error('Error fetching cat info:', error);
            return interaction.reply({ content: 'An error occurred while fetching your cat info.', ephemeral: true });
        }
    }
};