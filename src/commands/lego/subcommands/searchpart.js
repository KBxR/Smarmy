const { SlashCommandSubcommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { getRebrickablePartSearch } = require('@utils/api');

module.exports.data = new SlashCommandSubcommandBuilder()
    .setName('searchpart')
    .setDescription('Search list of parts.')
    .addStringOption(option =>
        option.setName('search')
            .setDescription('Search term for part.')
            .setRequired(true));
            
module.exports.execute = async function handleMinifigSearch(interaction) {
    const search = interaction.options.getString('search');
    const results = await getRebrickablePartSearch(search);

    let index = 0;
    const embed = new EmbedBuilder()
        .setTitle(`Results for ${search}`)
        .setDescription(`[${results[index].name}](${results[index].set_url})`)
        .setImage(results[index].set_img_url)
        .setFooter({ text: `Part ${index + 1} of ${results.length}` });

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('previous')
                .setLabel('Previous')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('next')
                .setLabel('Next')
                .setStyle(ButtonStyle.Primary)
        );

    const message = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });

    const filter = i => i.customId === 'previous' || i.customId === 'next';
    const collector = message.createMessageComponentCollector({ filter, time: 60000 });

    collector.on('collect', async i => {
        try {
            if (i.customId === 'previous') {
                index = index > 0 ? --index : results.length - 1;
            } else {
                index = index + 1 < results.length ? ++index : 0;
            }

            const embed = new EmbedBuilder()
                .setTitle(`Results for ${search}`)
                .setDescription(`[${results[index].name}](${results[index].part_url})`)
                .setImage(results[index].part_img_url)
                .setFooter({ text: `Part ${index + 1} of ${results.length}` });

            await i.update({ embeds: [embed] });
        } catch (error) {
            if (error.code === 10062) {
                console.log('Interaction has expired.');
            } else {
                console.error('Error updating interaction:', error);
            }
        }
    });

    collector.on('end', async () => {
        try {
            const disabledRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('previous')
                        .setLabel('Previous')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(true),
                    new ButtonBuilder()
                        .setCustomId('next')
                        .setLabel('Next')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(true)
                );

            await message.edit({ components: [disabledRow] });
        } catch (error) {
            console.error('Error editing message after collector end:', error);
        }
    });
};
