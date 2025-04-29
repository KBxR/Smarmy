const { SlashCommandSubcommandBuilder, EmbedBuilder } = require('discord.js');
const { databasePath, imgurKey } = require('@config');
const { Client } = require('pg');
const imgur = require('imgur');

const client = new Client({
    connectionString: `${databasePath}`,
});

client.connect();

module.exports.data = new SlashCommandSubcommandBuilder()
    .setName('storeadd')
    .setDescription('Add a store item.')
    .addAttachmentOption(option =>
        option.setName('picture')
            .setDescription('The picture for the store item.')
            .setRequired(true))
    .addStringOption(option =>
        option.setName('price')
            .setDescription('The price of the store item.')
            .setRequired(true));

module.exports.execute = async function handleTest(interaction) {
    // Check if the user is an admin
    const userId = interaction.user.id;
    if (!adminId.includes(userId)) {
        return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
    }

    // Get the values from the interaction
    const picture = interaction.options.getAttachment('picture');
    const price = interaction.options.getString('price');

    // Upload the picture to Imgur
    try {
        const imgurRes = await imgur.uploadUrl(picture.url, { clientId: imgurKey });
        const pictureUrl = imgurRes.data.link;

        // Insert the new store item into the database
        const insertRes = await client.query(`
            INSERT INTO cat_store (picture_url, price)
            VALUES ($1, $2)
            RETURNING id
        `, [pictureUrl, price]);

        const storeItemId = insertRes.rows[0].id;

        await interaction.reply({ content: `Store item added with ID ${storeItemId}.`, ephemeral: true });
    } catch (error) {
        console.error('Error adding store item:', error);
        await interaction.reply({ content: 'An error occurred while adding the store item. Please try again later.', ephemeral: true });
    }
};