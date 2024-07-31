const { Events, EmbedBuilder, PermissionsBitField } = require('discord.js');
const { pinChannel, pinServer } = require('@config');

async function fetchReactionMessage(reaction) {
    // When a reaction is received, check if the structure is partial
    if (reaction.partial) {
        try {
            await reaction.fetch();
        } catch (error) {
            console.error('Something went wrong when fetching the message:', error);
            return null;
        }
    }

    // Return the message information
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

module.exports = {
    eventName: 'Star To Channel',
    name: Events.MessageReactionAdd,
    async execute(reaction, user) {
        // Check if the reaction is a star
        if (reaction.emoji.name !== '⭐') return;

        // Get the message information from the reaction
        const messageInfo = await fetchReactionMessage(reaction);
        if (!messageInfo) return;

        // Check if the reaction is in the allowed server
        if (reaction.message.guild.id !== pinServer) {
            return;
        }

        // Check if the user has permission to pin messages
        const member = await reaction.message.guild.members.fetch(user.id);
        if (!member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
            console.error('User does not have permission to pin messages');
            return;
        }

        // Create an embed to log the star reaction
        const embed = new EmbedBuilder()
            .setColor('#FFD700')
            .setAuthor({ name: messageInfo.authorTag, iconURL: messageInfo.authorAvatarURL })
            .setFooter({ text: `Starred by ${user.tag}`, iconURL: user.displayAvatarURL() })
            .setTimestamp(reaction.message.createdTimestamp); // Use the original message timestamp

        // Add the message content to the embed
        if (messageInfo.content) {
            embed.setDescription(messageInfo.content);
        }

        // Add a link to the original message
        const messageLink = `https://discord.com/channels/${reaction.message.guild.id}/${reaction.message.channel.id}/${reaction.message.id}`;
        embed.addFields({ name: 'Original Message', value: `[Jump to Message](${messageLink})` });

        // Check for image attachments and add the first one to the embed
        const imageAttachment = messageInfo.attachments.find(attachment => attachment.contentType.startsWith('image/'));
        if (imageAttachment) {
            embed.setImage(imageAttachment.url);
        }

        const videoAttachment = messageInfo.attachments.find(attachment => attachment.contentType.startsWith('video/'));
        const audioAttachment = messageInfo.attachments.find(attachment => attachment.contentType.startsWith('audio/'));
        const voiceNoteAttachment = messageInfo.attachments.find(attachment => attachment.contentType.startsWith('voice/'));

        // Find the channel where you want to log the star reactions
        const targetChannelId = pinChannel; // Replace with your actual log channel ID
        const targetChannel = await reaction.message.client.channels.fetch(targetChannelId);

        if (targetChannel) {
            //check for attachments and add send the links in the message, if any, else send the embed
            if (videoAttachment) {
                targetChannel.send({ files: [videoAttachment.url], embeds: [embed] });
            } else if (audioAttachment) {
                targetChannel.send({ files: [audioAttachment.url], embeds: [embed] });
            } else if (voiceNoteAttachment) {
                targetChannel.send({ files: [voiceNoteAttachment.url], embeds: [embed] });
            } else {
                targetChannel.send({ embeds: [embed] });
            }

        } else {
            console.error('Log channel not found');
        }
    }
};