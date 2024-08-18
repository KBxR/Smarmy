const { Events } = require('discord.js');
const { setupDatabase } = require('@database/setup');

module.exports = {
    eventName: 'Guild Join Listener',
    name: Events.GuildCreate,
    async execute(guild) {
        setupDatabase(guild.id);
    }
};