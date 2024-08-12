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
        const serverId = reaction.message.guild.id;

        // Fetch the latest server configuration
        const serverConfig = await getServerConfig(serverId);
        const starboardConfig = serverConfig.starboard;

        // Check if starboard is enabled
        if (!starboardConfig.enabled) {
            console.log('Starboard is not enabled.');
            return;
        }

        const emoji = starboardConfig.emoji;
        const pinChannelId = starboardConfig.channelToSend;

        if (reaction.emoji.name !== emoji) {
            console.log(reaction.emoji, emoji);
            console.log('Reaction emoji does not match configured emoji.');
            return;
        }

        const message = reaction.message;
        const starReaction = message.reactions.cache.find(r => r.emoji.name === emoji && r.count > 1);
        if (starReaction) {
            console.log('Message already has a star reaction.');
            return;
        }

        const messageInfo = await fetchReactionMessage(reaction);
        if (!messageInfo) {
            console.log('Failed to fetch reaction message.');
            return;
        }

        const member = await reaction.message.guild.members.fetch(user.id);
        if (!await hasStarBoardPermission(serverId, user.id, member)) {
            console.log('User does not have starboard permission.');
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