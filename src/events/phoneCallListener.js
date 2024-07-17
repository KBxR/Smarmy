const { Events } = require('discord.js');

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        if (message.author.bot || !message.content) return;

        const serverId = message.guild.id;
        const channelId = message.channel.id;

        // Ensure global.activeCalls is initialized and contains the serverId
        if (global.activeCalls && global.activeCalls[serverId]) {
            // Check if the current channel is part of an active call
            const isActiveCall = global.activeCalls[serverId].includes(channelId);

            if (!isActiveCall) return; // Do not log the message if the call is not active

            //console.log(`Message from ${message.author.username} in ${message.guild.name} (#${message.channel.name}): ${message.content}`);

            // Find all channels connected in this call except the current one
            const connectedChannelIds = global.activeCalls[serverId].filter(id => id !== channelId);

            // Relay the message to each connected channel
            await Promise.all(connectedChannelIds.map(async (connectedChannelId) => {
                try {
                    const targetChannel = await message.client.channels.fetch(connectedChannelId);
                    await targetChannel.send(`<@${message.author.id}>: ${message.content}`);
                } catch (error) {
                    console.error(`Failed to send message to the connected channel: ${error}`);
                }
            }));
        }
    }
};