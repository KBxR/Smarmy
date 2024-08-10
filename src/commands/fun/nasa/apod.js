const { SlashCommandSubcommandBuilder, EmbedBuilder } = require('discord.js');
const { getAPOD } = require('@api/nasa');
const { getRandomHexColor } = require('@utils');

module.exports = {
    data: new SlashCommandSubcommandBuilder()
        .setName('apod')
        .setDescription('Fetch NASA\'s Astronomy Picture of the Day'),
    async execute(interaction) {
        // get the data from the NASA API
        const data = await getAPOD();
        
        // create a new embed
        const embed = new EmbedBuilder()
            .setColor(getRandomHexColor())
            .setTitle(data.title)
            .setDescription(data.explanation)
            .setFooter({ text: `Date: ${data.date}` });

        // Check if a thumbnail is provided and use it as the image
        if (data.thumbnail_url) {
            embed.setImage(data.thumbnail_url);
        } else {
            embed.setImage(data.url);
        }

        // Add a field with a link to the video if a video URL is provided
        if (data.media_type === 'video' && data.url) {
            embed.addFields({ name: 'Video Link', value: `[Watch Video](${data.url})`, inline: false });
        }

        // reply with the embed
        await interaction.reply({ embeds: [embed] });
    }
};