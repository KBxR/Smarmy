const { SlashCommandSubcommandBuilder } = require('discord.js');
const { sendWOTD } = require('@events/cheadlewotd');

module.exports.data = new SlashCommandSubcommandBuilder()
    .setName('test')
    .setDescription('Test command.')
    .addStringOption(option =>
        option.setName('channel')
            .setDescription('The channel ID to send the test message to.')
            .setRequired(true));
            

module.exports.execute = async function handleTest(interaction) {
    const client = interaction.client;
    const channelId = interaction.options.getString('channel');
    await sendWOTD(client, channelId);
};