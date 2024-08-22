const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const getServerConfig = require('@utils/getServerConfig');

const fileName = path.basename(__filename, path.extname(__filename));
const folderPath = path.join(__dirname, fileName);
const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));

const command = new SlashCommandBuilder()
    .setName('catgacha')
    .setDescription('Cat Gacha commands');

for (const file of commandFiles) {
    const commandData = require(path.join(folderPath, file));
    command.addSubcommand(() => commandData.data);
}

module.exports = {
    data: command,
    async execute(interaction) {
        const serverId = interaction.guild.id;
        const serverConfig = await getServerConfig(serverId);

        if (!serverConfig || !serverConfig.dailyCat.enabled) {
            await interaction.reply({ content: 'Cat gacha commands are disabled.', ephemeral: true });
            return;
        }

        const subcommand = interaction.options.getSubcommand();
        const commandFile = require(path.join(folderPath, `${subcommand}.js`));
        await commandFile.execute(interaction);
    }
};
