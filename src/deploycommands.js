require('module-alias/register');
const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');
const config = require('@config/config');

const guildCommands = [];
const globalCommands = [];
const commandsPath = path.join(__dirname, 'commands');
const guildId = config.guildId; 
const clientId = config.clientId;
const token = config.token;

function readCommandFiles(dir) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            // Recursively read subdirectories (only one level deep)
            const subFiles = fs.readdirSync(filePath).filter(f => f.endsWith('.js'));
            for (const subFile of subFiles) {
                const subFilePath = path.join(filePath, subFile);
                const command = require(subFilePath);

                if (command.category && command.category === 'admin') {
                    guildCommands.push(command.data.toJSON());
                } else {
                    globalCommands.push(command.data.toJSON());
                }
            }
        } else if (stat.isFile() && file.endsWith('.js')) {
            const command = require(filePath);

            if (command.category && command.category === 'admin') {
                guildCommands.push(command.data.toJSON());
            } else {
                globalCommands.push(command.data.toJSON());
            }
        }
    }
}

// Read all command files recursively
readCommandFiles(commandsPath);

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
    try {
        console.log('Started refreshing application (/) commands.');

        // Deploy guild-specific commands
        if (guildCommands.length > 0) {
            await rest.put(
                Routes.applicationGuildCommands(clientId, guildId),
                { body: guildCommands }
            );
            console.log('Successfully reloaded guild-specific (/) commands.');
        } else {
            console.log('No guild-specific commands to reload.');
        }

        // Deploy global commands
        if (globalCommands.length > 0) {
            await rest.put(
                Routes.applicationCommands(clientId),
                { body: globalCommands }
            );
            console.log('Successfully reloaded global (/) commands.');
        } else {
            console.log('No global commands to reload.');
        }

    } catch (error) {
        console.error('Error reloading commands:', error);
    }
})();
