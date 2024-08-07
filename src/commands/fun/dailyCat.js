const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Get the current file name without extension
const fileName = path.basename(__filename, path.extname(__filename));

// Create a folder with the file name
const folderPath = path.join(__dirname, fileName);

if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath);
    console.log(`Folder created: ${folderPath}`);
} else {
    console.log(`Folder already exists: ${folderPath}`);
}

// Read command files from the dynamically created folder
const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));

const command = new SlashCommandBuilder()
    .setName('dailycat')
    .setDescription('Fetch today\'s cat picture');

for (const file of commandFiles) {
    const commandData = require(path.join(folderPath, file));
    command.addSubcommand(() => commandData.data);
}

module.exports = {
    data: command,
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const commandFile = require(path.join(folderPath, `${subcommand}.js`));
        await commandFile.execute(interaction);
    }
};