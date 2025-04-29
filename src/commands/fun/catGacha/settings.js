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
                    { name: 'Cat Tree Add', value: 'cattreea' },
                    { name: 'Cat Tree Remove', value: 'cattreer' }
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

        try {
            switch (field) {
                case 'favorite': {
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
                }

                case 'cattreea': {
                    const ownedCats = await CatPicture.findAll({ where: { user_id: userID } });
                    const ownedCatIds = ownedCats.map(cat => cat.id.toString());

                    if (!ownedCatIds.includes(value)) {
                        return interaction.reply({ content: 'You do not own this cat.', ephemeral: true });
                    }

                    let userInfo = await UserInfo.findOne({ where: { user_id: userID } });

                    const currentCats = userInfo.info?.tree?.catsOnTree || [];

                    if (currentCats.includes(value)) {
                        return interaction.reply({ content: 'This cat is already on your tree.', ephemeral: true });
                    }

                    if (currentCats.length >= 3) {
                        return interaction.reply({ content: 'You can only have up to 3 cats on your tree.', ephemeral: true });
                    }

                    const updatedInfo = {
                        ...userInfo.info,
                        tree: {
                            ...userInfo.info.tree,
                            catsOnTree: [...currentCats, value]
                        }
                    };

                    await UserInfo.update({ info: updatedInfo }, { where: { user_id: userID } });
                    return interaction.reply({ content: `Cat ${value} has been added to your cat tree.`, ephemeral: true });
                }

                case 'cattreer': {
                    let userInfo = await UserInfo.findOne({ where: { user_id: userID } });

                    const currentCats = userInfo.info?.tree?.catsOnTree || [];
                    const updatedCats = currentCats.filter(catId => catId !== value);

                    const updatedInfo = {
                        ...userInfo.info,
                        tree: {
                            ...userInfo.info.tree,
                            catsOnTree: updatedCats
                        }
                    };

                    await UserInfo.update({ info: updatedInfo }, { where: { user_id: userID } });
                    return interaction.reply({ content: `Cat ${value} has been removed from your cat tree.`, ephemeral: true });
                }

                default:
                    return interaction.reply({ content: 'Invalid field specified.', ephemeral: true });
            }
        } catch (error) {
            console.error(`Error handling settings field "${field}":`, error);
            return interaction.reply({ content: 'An error occurred while updating your settings.', ephemeral: true });
        }
    }
};
