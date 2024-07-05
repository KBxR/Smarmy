const { ActivityType, Events } = require('discord.js');
const { User } = require('@database/models');
const { getBotInfo } = require('@utils/botInfoUtil');

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        const activityTypeMap = {
            Playing: ActivityType.Playing,
            Watching: ActivityType.Watching,
            Streaming: ActivityType.Streaming,
            Listening: ActivityType.Listening
        };

        try {
            // Fetch bot info from the database
            const { statusType, statusName } = await getBotInfo();

            // Set the bot's activity from the database
            client.user.setActivity(statusName, { type: activityTypeMap[statusType] });

            // Sync the User model with the database
            await User.sync();
            console.log('User model synchronized with the database');

            console.log(`Ready! Logged in as ${client.user.tag}`);
        } catch (error) {
            console.error('Error setting bot status or synchronizing User model:', error);
        }
    },
};