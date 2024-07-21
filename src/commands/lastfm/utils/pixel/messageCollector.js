const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');

function messageCollector(interaction, albumName, imageUrl, randomAlbum) {
    const filter = m => m.author.id === interaction.user.id;
    const messageCollector = interaction.channel.createMessageCollector({ filter, time: 60000 }); // Adjust time as needed

    messageCollector.on('collect', async m => {
        if (m.content.toLowerCase() === albumName.toLowerCase()) {
            // Correct guess

            const completedEmbed = new EmbedBuilder()
                .setColor('#ffd700')
                .setTitle('Guess the Album - Completed!')
                .setDescription(`Congratulations! You guessed the album correctly: **${albumName}**`);

            const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('hint')
                    .setLabel('❕ Hint ❕')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(true),
            );

            // Edit the original message with the new embed and unpixelated image
            await interaction.editReply({
                files: [imageUrl],
                embeds: [completedEmbed],
                components: [row]
            });

            await m.reply(`Congratulations! You guessed the album correctly: **${albumName}**`);

            messageCollector.stop(); // Stop collecting further messages
        } else {
            await m.reply(`That's not correct, try again!`);
        }
    });

    messageCollector.on('end', collected => {
        if (collected.size === 0) {
            interaction.followUp(`Time's up! The correct album was **${albumName}**.`);

            const imageUrl = randomAlbum.image[3]['#text'];
            const failedEmbed = new EmbedBuilder()
                .setColor('#b3b3b3')
                .setTitle('Guess the Album - Failed!')
                .setDescription(`The album was **${albumName}**`)

            const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('hint')
                    .setLabel('❕ Hint ❕')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(true),
            );
            
            interaction.editReply({
                files: [imageUrl],
                embeds: [failedEmbed],
                components: [row]
            });
        }
        messageCollector.stop();
    });
}

module.exports = messageCollector;