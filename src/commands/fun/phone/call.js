const { SlashCommandSubcommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandSubcommandBuilder()
        .setName('call')
        .setDescription('Toggle a call on or off'),
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: false });
        const serverId = interaction.guild.id;
        const channelId = interaction.channel.id;

        if (!global.activeCalls) global.activeCalls = {};

        // Check if the channel is already in a call
        if (Object.values(global.activeCalls).flat().includes(channelId)) {
            // Stop the call
            const connectedChannelId = global.activeCalls[serverId].find(id => id !== channelId);
            delete global.activeCalls[serverId];
            if (connectedChannelId) {
                const otherServerId = Object.keys(global.activeCalls).find(key => global.activeCalls[key].includes(connectedChannelId));
                if (otherServerId) delete global.activeCalls[otherServerId];
                await interaction.editReply({ content: 'Call ended. You are now disconnected.' });
            
                // Fetch the connected channel and send a notification
                const connectedChannel = await interaction.client.channels.fetch(connectedChannelId);
                if (connectedChannel) {
                    await connectedChannel.send('The call was ended by the other party.');
                }
            } else {
                await interaction.editReply({ content: 'Call stopped. There was no connected channel.' });
            }
        } else {
            // Attempt to start a call
            // Check if there's a waiting channel in any server
            let waitingChannelId = null;
            for (const [key, value] of Object.entries(global.activeCalls)) {
                if (value.length === 1) {
                    waitingChannelId = value[0];
                    break;
                }
            }

            if (waitingChannelId) {
                // Connect to the waiting channel
                global.activeCalls[serverId] = [channelId, waitingChannelId];
                const otherServerId = Object.keys(global.activeCalls).find(key => global.activeCalls[key].includes(waitingChannelId));
                if (otherServerId) {
                    global.activeCalls[otherServerId].push(channelId);
                }
                await interaction.editReply({ content: 'Call started. You are now connected to another channel. Say Hi!' });
            } else {
                // No waiting channel, so mark this channel as waiting
                global.activeCalls[serverId] = [channelId];
                await interaction.editReply({ content: 'Call started. Waiting for another channel to connect.' });
            }
        }
    }
};