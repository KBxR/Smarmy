const { UserInfo } = require('@database/setup');
const { CatPicture } = require('@database/models');
const { SlashCommandSubcommandBuilder, EmbedBuilder } = require('discord.js');
const { getRandomHexColor } = require('@utils');

module.exports = {
    data: new SlashCommandSubcommandBuilder()
        .setName('profile')
        .setDescription('Get a user\'s profile.')
        .addUserOption(option =>
            option.setName('member')
                .setDescription('The user whose profile you want to view.')
                .setRequired(false)),

    async execute(interaction) {
        let userId = interaction.user.id;
        const member = interaction.options.getMember('member');

        // use the members id if it was provided
        if (interaction.options.getUser('member')) {
            userId = interaction.options.getUser('member').id;
        }
        
        let username = interaction.user.username;

        try {
            let user = await UserInfo.findByPk(userId);

            if (!user.info.dailycat) {
                return interaction.reply({ content: 'No profile found for this user.', ephemeral: true });
            }

            const dailyCatInfo = user.info.dailycat;
            const { cats, lastcat, favorite, catBucks } = dailyCatInfo;
            
            if(member){
                username = member.user.username;
            }

            const randomColor = getRandomHexColor();

            const embed = new EmbedBuilder()
                .setColor(randomColor)
                .setTitle(`${username}'s Profile`)
                .addFields(
                    { name: 'Total Cats', value: `${cats.toString()}`, inline: true },
                    { name: 'Last Cat Date', value: `${lastcat}`, inline: true },
                    { name: 'Cat Bucks', value: `₡${catBucks}`, inline: true }
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
            console.error('Error fetching profile:', error);
            return interaction.reply({ content: 'An error occurred while fetching your profile.', ephemeral: true });
        }
    }
};