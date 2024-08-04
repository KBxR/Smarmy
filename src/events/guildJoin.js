const { Events } = require('discord.js');
const { setupDatabase } = require('@database/setup');

module.exports = {
    eventName: 'Guild Join Listener',
    name: Events.GuildCreate,
    async execute(guild) {
        console.log(`Joined new guild: ${guild.name} (ID: ${guild.id})`);
        setupDatabase(guild.id);
    }
};