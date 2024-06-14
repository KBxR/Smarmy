const { SlashCommandSubcommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports.data = new SlashCommandSubcommandBuilder()
    .setName('guildlist')
    .setDescription('Lists every server the bot is in');

module.exports.execute = async function handleGuildList(interaction) {

        const guilds = interaction.client.guilds.cache.map(guild => ({
            name: guild.name,
            id: guild.id,
            memberCount: guild.memberCount
        }));

        let guildList = 'List of servers the bot is in:\n\n';
        guilds.forEach(guild => {
            guildList += `Name: ${guild.name}\nID: ${guild.id}\nMembers: ${guild.memberCount}\n\n`;
        });

        const filePath = path.join(__dirname, 'guilds.txt');
        fs.writeFileSync(filePath, guildList);

        await interaction.reply({ content: 'Here is the list of servers the bot is in:', files: [filePath], ephemeral: true});

        // Clean up the file after sending
        fs.unlinkSync(filePath);
};
