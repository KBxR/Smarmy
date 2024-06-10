const { MessageAttachment } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {

    async execute(interaction) {
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

        const attachment = new MessageAttachment(filePath);

        await interaction.reply({ content: 'Here is the list of servers the bot is in:', files: [attachment] });

        // Clean up the file after sending
        fs.unlinkSync(filePath);
    }
};
