const { SlashCommandSubcommandBuilder } = require('@discordjs/builders');
const { UserInfo } = require('@database/setup');

module.exports.data = new SlashCommandSubcommandBuilder()
    .setName('userinfo')
    .setDescription('Update a user\'s information')
    .addStringOption(option =>
        option.setName('field')
        .setDescription('The field to update')
        .setRequired(true)
        .addChoices(
            { name: 'LastFM.Username', value: 'lastfm.username' },
            { name: 'DailyCat.Cats', value: 'dailycat.cats' },
            { name: 'DailyCat.LastCat', value: 'dailycat.lastcat' },
            { name: 'DailyCat.CatBucks', value: 'dailycat.catBucks' },
            { name: 'DailyCat.Favorite', value: 'dailycat.favorite' },
        )
)
.addStringOption(option =>
    option.setName('value')
        .setDescription('The new value for the selected field')
        .setRequired(true)
)
.addStringOption(option =>
    option.setName('user')
        .setDescription('The user ID to update')
        .setRequired(true)
);

module.exports.execute = async function handleUpdateBot(interaction) {
const field = interaction.options.getString('field');
const value = interaction.options.getString('value');
const userId = interaction.options.getString('user');

try {
    let userInfo = await UserInfo.findOne({ where: { user_id: userId } });
    if (!userInfo) {
        return interaction.reply({ content: 'User info not found.', ephemeral: true });
    }

    const fields = field.split('.');
    let updatedInfo = { ...userInfo.info };

    let current = updatedInfo;
    for (let i = 0; i < fields.length - 1; i++) {
        current = current[fields[i]];
    }

    // Validate if the field is one of the numeric fields
    if (['dailycat.cats', 'dailycat.catBucks', 'dailycat.favorite'].includes(field)) {
        if (isNaN(value)) {
            return interaction.reply({ content: 'The value must be a number.', ephemeral: true });
        }
        current[fields[fields.length - 1]] = Number(value);
    } else {
        current[fields[fields.length - 1]] = value;
    }

    await UserInfo.update({ info: updatedInfo }, { where: { user_id: userId } });

    return interaction.reply({ content: `User info updated successfully for user ID: ${userId}.`, ephemeral: true });
} catch (error) {
    console.error('Error updating user info:', error);
    return interaction.reply({ content: 'An error occurred while updating user info.', ephemeral: true });
}
};