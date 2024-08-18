const { SlashCommandSubcommandBuilder } = require('discord.js');
const { UserInfo } = require('@database/setup');
const { CatPicture } = require('@database/models');

module.exports = {
    data: new SlashCommandSubcommandBuilder()
        .setName('settings')
        .setDescription('Settings for the cat command')
        .addStringOption(option =>
            option.setName('field')
                .setDescription('The setting to change')
                .setRequired(true)
                .addChoices(
                    { name: 'FavoriteCat', value: 'favorite' },
                )
        )
        .addStringOption(option =>
            option.setName('value')
                .setDescription('The new value for the settings field')
                .setRequired(true)
        ),
    async execute(interaction) {
        const field = interaction.options.getString('field');
        const value = interaction.options.getString('value');
        const userID = interaction.user.id;

        if (field !== 'favourite') {
            return interaction.reply({ content: 'Invalid field specified.', ephemeral: true });
        }

        try {
            // Fetch user info from the database
            let user = await UserInfo.findByPk(userID);
            if (!user) {
                return interaction.reply({ content: 'User not found.', ephemeral: true });
            }

            // Check if the user owns the cat
            const ownedCats = await CatPicture.findAll({ where: { user_id: userID } });
            const ownedCatIds = ownedCats.map(cat => cat.id.toString());

            if (!ownedCatIds.includes(value)) {
                return interaction.reply({ content: 'You do not own this cat.', ephemeral: true });
            }

            let userInfo = await UserInfo.findOne({ where: { user_id: userID } });
            const updatedInfo = { 
                ...userInfo.info, 
                dailycat: { 
                    ...userInfo.info.dailycat, 
                    favorite: value
                } 
            };

            await UserInfo.update({ info: updatedInfo }, { where: { user_id: userID } });

            return interaction.reply({ content: `Your favourite cat has been updated to ${value}.`, ephemeral: true });
        } catch (error) {
            console.error('Error updating favourite cat:', error);
            return interaction.reply({ content: 'An error occurred while updating your favourite cat.', ephemeral: true });
        }
    }
};