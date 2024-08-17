const { SlashCommandSubcommandBuilder } = require('discord.js');
const { sendWOTD } = require('@events/cheadlewotd');

module.exports.data = new SlashCommandSubcommandBuilder()
    .setName('test')
    .setDescription('Test command.');

module.exports.execute = async function handleTest(interaction) {
    const client = interaction.client; // Get the client from the interaction object
    await sendWOTD(client, '1076196921682702356');
};