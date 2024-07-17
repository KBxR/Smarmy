const { SlashCommandSubcommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandSubcommandBuilder()
        .setName('call')
        .setDescription('Start or stop a call')
        .addStringOption(option =>
            option.setName('action')
                .setDescription('Start or stop a call')
                .setRequired(true)
                .addChoices(
                    { name: 'start', value: 'start' },
                    { name: 'stop', value: 'stop' }
                )),
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: false });
        const action = interaction.options.getString('action');
        const serverId = interaction.guild.id;
        const channelId = interaction.channel.id;
        
        if (!global.activeCalls) global.activeCalls = {};
        
        if (action === 'start') {
            if (Object.values(global.activeCalls).flat().includes(channelId)) {
                await interaction.editReply({ content: 'This channel is already in a call.' });
                return;
            }
        
            let connectedChannelId = null;
            for (const [key, value] of Object.entries(global.activeCalls)) {
                if (key !== serverId && value.length === 1) {
                    connectedChannelId = value[0];
                    break;
                }
            }
        
            if (connectedChannelId) {
                global.activeCalls[serverId] = [channelId, connectedChannelId];
                const otherServerId = Object.keys(global.activeCalls).find(key => global.activeCalls[key].includes(connectedChannelId));
                if (otherServerId) {
                    global.activeCalls[otherServerId] = [connectedChannelId, channelId];
                }
                await interaction.editReply({ content: 'Call started. You are now connected to another channel.' });
        
                const channelsInvolved = [channelId, connectedChannelId];
                for (const chId of channelsInvolved) {
                    const channel = await interaction.client.channels.fetch(chId).catch(console.error);
                    if (channel) {
                        try {
                            await channel.send("You are now connected to another channel.");
                        } catch (error) {
                            console.error(`Failed to send connection message to channel ${chId}: ${error}`);
                        }
                    }
                }
            } else {
                global.activeCalls[serverId] = [channelId];
                await interaction.editReply({ content: 'Waiting for another channel to connect.' });
            }
        } else if (action === 'stop') {
            if (global.activeCalls[serverId] && global.activeCalls[serverId].includes(channelId)) {
                const connectedChannelId = global.activeCalls[serverId].find(id => id !== channelId);
                delete global.activeCalls[serverId];
                if (connectedChannelId) {
                    const otherServerId = Object.keys(global.activeCalls).find(key => global.activeCalls[key].includes(connectedChannelId));
                    if (otherServerId) delete global.activeCalls[otherServerId];
                    await interaction.editReply({ content: 'Call stopped. You are now disconnected.' });
                } else {
                    await interaction.editReply({ content: 'Call stopped. There was no connected channel.' });
                }
            } else {
                await interaction.editReply({ content: 'This channel is not currently in a call.' });
            }
        }
    },
};