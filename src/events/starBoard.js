const { Events, EmbedBuilder, PermissionsBitField } = require('discord.js');
const { hasPermission } = require('@utils/permissions');
const getServerConfig = require('@utils/getServerConfig');

async function fetchReactionMessage(reaction) {
    if (reaction.partial) {
        try {
            await reaction.fetch();
        } catch (error) {
            console.error('Something went wrong when fetching the message:', error);
            return null;
        }
    }

    const message = reaction.message;
    return {
        authorTag: message.author.tag,
        authorAvatarURL: message.author.displayAvatarURL(),
        content: message.content,
        messageId: message.id,
        channelId: message.channel.id,
        attachments: message.attachments,
    };
}

async function hasStarBoardPermission(serverId, userId, member) {
    const hasCustomPermission = await hasPermission(serverId, userId, 'starboard');
    const hasPinPermission = member.permissions.has(PermissionsBitField.Flags.ManageMessages);

    return hasCustomPermission || hasPinPermission;
}

module.exports = {
    eventName: 'Star Board',
    name: Events.MessageReactionAdd,
    async execute(reaction, user) {
        console.log('Reaction added:', reaction.emoji.name, 'by user:', user.tag);

        const serverId = reaction.message.guild.id;

        // Fetch the latest server configuration
        let serverConfig;
        try {
            serverConfig = await getServerConfig(serverId);
        } catch (error) {
            console.error('Failed to fetch server configuration:', error);
            return;
        }

        if (!serverConfig || !serverConfig.starboard) {
            return;
        }

        const starboardConfig = serverConfig.starboard;

        // Check if starboard is enabled
        if (!starboardConfig.enabled) {
            return;
        }

        const emoji = starboardConfig.emoji;
        const pinChannelId = starboardConfig.channelToSend;
        const threshold = starboardConfig.threshold;

        if (reaction.emoji.name !== emoji) {
            return;
        }

        // Ensure the message reactions are fully fetched
        if (reaction.message.partial) {
            try {
                await reaction.message.fetch();
            } catch (error) {
                console.error('Something went wrong when fetching the message:', error);
                return;
            }
        }

        // Count the number of reactions matching the configured emoji
        const reactionCount = reaction.message.reactions.cache.filter(r => r.emoji.name === emoji).reduce((acc, r) => acc + r.count, 0);

        console.log('Reaction count:', reactionCount, 'Threshold:', threshold);

        if (reactionCount < threshold) {
            return;
        }

        const message = reaction.message;
        if (threshold <= 1) {
            const starReaction = message.reactions.cache.find(r => r.emoji.name === emoji && r.count > 1);
            if (starReaction) {
                return;
            }
        }

        const messageInfo = await fetchReactionMessage(reaction);
        if (!messageInfo) {
            return;
        }

        const member = await reaction.message.guild.members.fetch(user.id);
        if (!await hasStarBoardPermission(serverId, user.id, member)) {
            return;
        }

        const embed = new EmbedBuilder()
            .setColor('#FFD700')
            .setAuthor({ name: `Sender: ${messageInfo.authorTag}`, iconURL: messageInfo.authorAvatarURL })
            .setFooter({ text: `Starred by ${user.tag}`, iconURL: user.displayAvatarURL() })
            .setTimestamp(reaction.message.createdTimestamp);

        // Add the message content to the embed
        if (messageInfo.content) {
            embed.setDescription(messageInfo.content);
        }

        const messageLink = `https://discord.com/channels/${reaction.message.guild.id}/${reaction.message.channel.id}/${reaction.message.id}`;
        embed.addFields({ name: 'Original Message', value: `[Jump to Message](${messageLink})` });

        const imageAttachment = messageInfo.attachments.find(attachment => attachment.contentType.startsWith('image/'));
        if (imageAttachment) {
            embed.setImage(imageAttachment.url);
        }

        const tenorGifLink = messageInfo.content.match(/https:\/\/tenor\.com\/view\/[^\s]+/);
        if (tenorGifLink) {
            embed.setImage(tenorGifLink[0]);
        }

        const videoAttachment = messageInfo.attachments.find(attachment => attachment.contentType.startsWith('video/'));
        const audioAttachment = messageInfo.attachments.find(attachment => attachment.contentType.startsWith('audio/'));
        const voiceNoteAttachment = messageInfo.attachments.find(attachment => attachment.contentType.startsWith('voice/'));

        const pinChannel = reaction.message.guild.channels.cache.get(pinChannelId);
        if (!pinChannel) {
            console.log('Pin channel not found.');
            return;
        }

        try {
            if (videoAttachment) {
                await pinChannel.send({ files: [videoAttachment.url], embeds: [embed] });
            } else if (audioAttachment) {
                await pinChannel.send({ files: [audioAttachment.url], embeds: [embed] });
            } else if (voiceNoteAttachment) {
                await pinChannel.send({ files: [voiceNoteAttachment.url], embeds: [embed] });
            } else {
                await pinChannel.send({ embeds: [embed] });
            }
        } catch (error) {
            console.error('Failed to send message to pin channel:', error);
        }
    }
};