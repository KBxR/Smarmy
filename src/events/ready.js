const { ActivityType, Events } = require('discord.js');
const { getBotInfo } = require('@utils/botInfoUtil');
const { sendWOTD } = require('@events/cheadlewotd');
const cron = require('node-cron');
const { refreshCatCache } = require('@commands/fun/catGacha/shop');

module.exports = {
    eventName: 'Ready',
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

            console.log(`Ready! Logged in as ${client.user.tag}`);

            // fetch initial cat shop
            refreshCatCache();

            cron.schedule('0 0 * * *', () => {
                sendWOTD(client, '1273979538505859253');
                console.log('Cheadle Word of the Day scheduled task completed');
                refreshCatCache();
                console.log('Cat shop refreshed');
            });

        } catch (error) {
            console.error('Error setting bot status or synchronizing User model:', error);
        }
    },
};