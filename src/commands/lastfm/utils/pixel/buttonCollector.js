const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ComponentType } = require('discord.js');
const { createCanvas, loadImage } = require('canvas');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function pixelateImage(imageUrl, scale) {
    const response = await fetch(imageUrl);
    const buffer = Buffer.from(await response.arrayBuffer());
    const originalImage = await loadImage(buffer);
    const pixelatedWidth = originalImage.width * scale;
    const pixelatedHeight = originalImage.height * scale;

    const canvas = createCanvas(pixelatedWidth, pixelatedHeight);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(originalImage, 0, 0, pixelatedWidth, pixelatedHeight);

    const finalCanvas = createCanvas(originalImage.width, originalImage.height);
    const finalCtx = finalCanvas.getContext('2d');
    finalCtx.imageSmoothingEnabled = false;
    finalCtx.drawImage(canvas, 0, 0, originalImage.width, originalImage.height);

    return finalCanvas.toBuffer();
}

async function buttonCollector(interaction, imageUrl, jumbledName, artistName) {
    const buttonFilter = i => i.user.id === interaction.user.id;
    const buttonCollector = interaction.channel.createMessageComponentCollector({ buttonFilter, componentType: ComponentType.Button, time: 60000 }); // Adjust time as needed

    buttonCollector.on('collect', async i => {
        if (i.customId === 'hint') {
            try {
                // Acknowledge the button interaction immediately to avoid "interaction failed" error
                await i.deferUpdate();
    
                // Pixelate the image with a higher scale factor for a hint
                const hintAttachment = await pixelateImage(imageUrl, 0.3);
                const hintEmbed = new EmbedBuilder()
                    .setColor('#b3b3b3')
                    .setTitle('Guess the Album - Hint')
                    .setDescription(`Guess the album from the pixelated image below. The album name has been jumbled up: \`${jumbledName}\``)
                    .addFields(
                        { name: 'Hint: Artist Name', value: artistName, inline: true },
                    );
    
                // Since deferUpdate was called, use editReply to modify the interaction's original reply
                await i.editReply({
                    files: [hintAttachment],
                    embeds: [hintEmbed],
                    components: [] // Optionally, remove or update components if needed
                });

            } catch (error) {
                console.error('Failed to handle hint button interaction:', error);
                // If there was an error after deferring, use editReply to indicate the error
                await i.editReply({ content: 'There was an error processing your request.', components: [] });
            }
        }
        buttonCollector.stop();
    });

    // Handle the end of the collector
    buttonCollector.on('end', collected => {
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('hint')
                    .setLabel('❕ Hint ❕')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(true),
            );
        interaction.editReply({ components: [row] });
        buttonCollector.stop();
    });
}

module.exports = buttonCollector;