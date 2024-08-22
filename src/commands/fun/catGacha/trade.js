const { SlashCommandSubcommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } = require('discord.js');
const { databasePath } = require('@config');
const { Client } = require('pg');
const { createCanvas, loadImage } = require('canvas');

const client = new Client({ connectionString: databasePath });

client.connect();

module.exports = {
    data: new SlashCommandSubcommandBuilder()
        .setName('trade')
        .setDescription('Trade your cat picture with another user')
        .addUserOption(option => option
            .setName('member')
            .setDescription('The user you want to trade with')
            .setRequired(true))
        .addStringOption(option => option
            .setName('your_cat_id')
            .setDescription('Your cat ID to trade')
            .setRequired(true))
        .addStringOption(option => option
            .setName('their_cat_id')
            .setDescription('The other user\'s cat ID to trade')
            .setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: false });

        const userId = interaction.user.id;
        const targetUser = interaction.options.getUser('member');
        const userCatId = interaction.options.getString('your_cat_id');
        const targetCatId = interaction.options.getString('their_cat_id');

        const userCatRes = await client.query(
            `SELECT id, picture_url FROM cat_pictures WHERE user_id = $1 AND id = $2`,
            [userId, userCatId]
        );

        const targetCatRes = await client.query(
            `SELECT id, picture_url FROM cat_pictures WHERE user_id = $1 AND id = $2`,
            [targetUser.id, targetCatId]
        );

        if (userCatRes.rowCount === 0) {
            await interaction.editReply({ content: 'You do not have a cat picture with the specified ID.', ephemeral: true });
            return;
        }

        if (targetCatRes.rowCount === 0) {
            await interaction.editReply({ content: 'The target user does not have a cat picture with the specified ID.', ephemeral: true });
            return;
        }

        const userCatPicture = userCatRes.rows[0].picture_url;
        const targetCatPicture = targetCatRes.rows[0].picture_url;

        const userImage = await loadImage(userCatPicture);
        const targetImage = await loadImage(targetCatPicture);

        const minWidth = Math.min(userImage.width, targetImage.width);
        const minHeight = Math.min(userImage.height, targetImage.height);

        const userAspectRatio = userImage.width / userImage.height;
        const targetAspectRatio = targetImage.width / targetImage.height;

        let userNewWidth, userNewHeight, targetNewWidth, targetNewHeight;

        if (userAspectRatio > targetAspectRatio) {
            userNewWidth = minWidth;
            userNewHeight = minWidth / userAspectRatio;
            targetNewWidth = minHeight * targetAspectRatio;
            targetNewHeight = minHeight;
        } else {
            userNewWidth = minHeight * userAspectRatio;
            userNewHeight = minHeight;
            targetNewWidth = minWidth;
            targetNewHeight = minWidth / targetAspectRatio;
        }

        const canvas = createCanvas(userNewWidth + targetNewWidth, Math.max(userNewHeight, targetNewHeight));
        const ctx = canvas.getContext('2d');

        ctx.drawImage(userImage, 0, 0, userNewWidth, userNewHeight);
        ctx.drawImage(targetImage, userNewWidth, 0, targetNewWidth, targetNewHeight);

        const buffer = canvas.toBuffer('image/png');
        const attachment = new AttachmentBuilder(buffer, { name: 'trade_image.png' });

        const embed = new EmbedBuilder()
            .setColor('#ffffff')
            .setTitle('Cat Picture Trade Request')
            .setDescription(`${interaction.user.username} wants to trade cat pictures with you.`)
            .addFields(
                { name: `${interaction.user.username}'s Cat Picture ID`, value: userCatId, inline: true },
                { name: `${targetUser.username}'s Cat Picture ID`, value: targetCatId, inline: true }
            )
            .setImage('attachment://trade_image.png')
            .setFooter({ text: `${interaction.user.username}'s Cat ID: ${userCatId} | ${targetUser.username}'s Cat ID: ${targetCatId}` });

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder().setCustomId('accept_trade').setLabel('Accept').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('decline_trade').setLabel('Decline').setStyle(ButtonStyle.Danger)
            );

        const message = await interaction.editReply({ content: `<@${targetUser.id}>`, embeds: [embed], components: [row], files: [attachment] });

        const filter = i => i.customId === 'accept_trade' || i.customId === 'decline_trade';
        const collector = message.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async i => {
            if (i.user.id !== targetUser.id) {
                await i.reply({ content: 'You cannot respond to this trade request.', ephemeral: true });
                return;
            }

            if (i.customId === 'accept_trade') {
                await client.query('BEGIN');
                await client.query(`UPDATE cat_pictures SET user_id = $1 WHERE id = $2`, [targetUser.id, userCatId]);
                await client.query(`UPDATE cat_pictures SET user_id = $1 WHERE id = $2`, [interaction.user.id, targetCatId]);
                await client.query('COMMIT');

                const acceptedEmbed = EmbedBuilder.from(embed)
                    .setColor('#00FF00')
                    .setTitle('Cat Picture Trade Successful!')
                    .setDescription(`${interaction.user.username} and ${i.user.username} have successfully traded cat pictures.`);

                await i.update({ embeds: [acceptedEmbed], components: [] });
            } else {
                const declinedEmbed = EmbedBuilder.from(embed)
                    .setColor('#FF0000')
                    .setTitle('Cat Picture Trade Declined')
                    .setDescription(`${interaction.user.username}'s trade request was declined.`);

                await i.update({ embeds: [declinedEmbed], components: [] });
            }
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                message.edit({ content: 'Trade request timed out.', components: [] });
            }
        });
    }
};