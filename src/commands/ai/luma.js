const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { exec } = require('child_process');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const { getBotInfo } = require('@utils/botInfoUtil');
const { getRandomHexColor } = require('@utils/colorUtil');
const { authorName, authorIconUrl } = await getBotInfo();
const randomColor = getRandomHexColor();

module.exports = {
	category: 'ai',
	data: new SlashCommandBuilder()
		.setName('luma')
		.setDescription('Makes a request to the Luma AI.')
		.addStringOption(option =>
			option.setName('prompt')
				.setDescription('The prompt to send to the AI.')
				.setRequired(true))
        .addAttachmentOption(option =>
            option.setName('attachment')
                .setDescription('The attachment to send to the AI')
                .setRequired(true)),
                async execute(interaction) {
                    const prompt = interaction.options.getString('prompt');
                    const attachment = interaction.options.getAttachment('attachment');
                    
                    const escapedPrompt = prompt.replace(/"/g, '\\"');
                    
                    // Download the image file
                    const response = await fetch(attachment.url);
                    const buffer = await response.buffer();
                    const filePath = path.join(__dirname, 'tempImage.jpg');
                    fs.writeFileSync(filePath, buffer);

                    const escapedAttachment = filePath.replace(/"/g, '\\"');
                
                    // Create an embed message
                    const embed = new EmbedBuilder()
                        .setColor(randomColor)
                        .setAuthor({ name: authorName, iconURL: authorIconUrl })
                        .setTitle('Processing...')
                        .setDescription(`Prompt: ${prompt}\nPlease wait while the AI generates the video.`)
                        .setImage(attachment.url);
                
                    // Send the embed message
                    interaction.reply({ embeds: [embed], fetchReply: true });
                
                    exec(`python ./src/commands/ai/DreamMachineAPI-main/main.py "${escapedPrompt}" "${escapedAttachment}"`, (error, stdout, stderr) => {
                        if (error) {
                            console.error(`exec error: ${error}`);
                            return;
                        }
                        console.log(`Python script output: ${stdout}`);
                
                        // Extract the video URL from the Python script output
                        const videoUrl = stdout.match(/New video link: (.*)/)[1];
                
                        // Edit the embed message with the video URL
                        embed.setTitle('AI Generated Video')
                            .setDescription(`[Click here to view the video](${videoUrl})`);
                
                        // Edit the message with the new embed
                        interaction.editReply({ embeds: [embed] });
                    });
                }
};