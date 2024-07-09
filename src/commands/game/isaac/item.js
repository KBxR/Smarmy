const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, SlashCommandSubcommandBuilder } = require('discord.js');
const { getIsaacItemName, getIsaacItemID } = require('@utils/api');

module.exports.data = new SlashCommandSubcommandBuilder()
    .setName('item')
    .setDescription('Gets an item\'s information from The Binding of Isaac: Rebirth')
    .addStringOption(option =>
        option.setName('name')
            .setDescription('Item name or to search for'))
    .addStringOption(option =>
        option.setName('id')
            .setDescription('Item ID to search for'));
            
module.exports.execute = async function handleIsaacItem(interaction) {
    const name = interaction.options.getString('name');
    const id = interaction.options.getString('id');
    let currentIndex = 0;
    const itemFullStar = "<:item_quality_1:1260244512916246550>"
    const itemEmptyStar = "<:item_quality_0:1260244512027054192>"

    try {   
        let res;
        if (name) {
            res = await getIsaacItemName(name);
        } else if (id) {
            res = await getIsaacItemID(id);
        } else {
            return interaction.reply({ content: 'Please provide an item name or ID.', ephemeral: true });
        }

        if (res.length === 0) {
            return interaction.reply({ content: 'No items found.', ephemeral: true });
        }

        const updateEmbed = (index) => {
            const item = res[index];
            const itemEmbed = new EmbedBuilder()
                .setColor('#e4141e')
                .setTitle(`${item.name}`)
                .setURL(`https://bindingofisaacrebirth.fandom.com/wiki/${item.name.replace(/ /g, '_')}`)
                .setThumbnail(item.image)
                .setFooter({ text: `Page ${index + 1} of ${res.length}` })
                itemEmbed.addFields({ name: '**ID**', value: `\`${item.id}\``, inline: true })

                if (item.quality !== "6") {
                    let itemQuality;
                    switch (item.quality) {
                        case 0:
                            itemQuality = `${itemEmptyStar.repeat(5)}`;
                            break;
                        case 1:
                            itemQuality = `${itemFullStar}${itemEmptyStar.repeat(4)}`;
                            break;
                        case 2:
                            itemQuality = `${itemFullStar.repeat(2)}${itemEmptyStar.repeat(3)}`;
                            break;
                        case 3:
                            itemQuality = `${itemFullStar.repeat(3)}${itemEmptyStar.repeat(2)}`;
                            break;
                        case 4:
                            itemQuality = `${itemFullStar.repeat(4)}${itemEmptyStar}`;
                            break;
                        case 5:
                            itemQuality = `${itemFullStar.repeat(5)}`;
                            break
                        default:
                            itemQuality = "";
                    }
                    if (itemQuality) {
                        itemEmbed.addFields({ name: '**Item Quality**', value: itemQuality, inline: true });
                    }
                }

                if (item.dlc !== "none") {
                    let dlcName;
                    switch (item.dlc) {
                        case "a":
                            dlcName = "<:dlc_a:1259327747319398480> Afterbirth";
                            break;
                        case "ap":
                            dlcName = "<:dlc_ap:1259324822639611954> Afterbirth+";
                            break;
                        case "r":
                            dlcName = "<:dlc_r:1259327686258593802> Repentance";
                            break;
                        default:
                            dlcName = "";
                    }
                    if (dlcName) {
                        itemEmbed.addFields({ name: '**DLC**', value: dlcName, inline: true });
                    }
                }

                itemEmbed.addFields({ name: '**Quote**', value: `*${item.quote}*`, inline: false })
                itemEmbed.addFields({ name: '**Description**', value: `${item.description}`, inline: true })

            return itemEmbed;
        };

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('previous')
                    .setLabel('◀')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('next')
                    .setLabel('▶')
                    .setStyle(ButtonStyle.Primary)
            );

        const itemEmbed = updateEmbed(currentIndex);
        await interaction.reply({ embeds: [itemEmbed], components: res.length > 1 ? [row] : [] });

        const filter = (i) => i.user.id === interaction.user.id;
        const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async (i) => {
            if (i.customId === 'next') {
                currentIndex = (currentIndex + 1) % res.length; // Loop back to start if at the end
            } else if (i.customId === 'previous') {
                currentIndex = (currentIndex - 1 + res.length) % res.length; // Loop back to end if at the start
            }

            const newEmbed = updateEmbed(currentIndex);
            await i.update({ embeds: [newEmbed], components: [row] });
        });
        setTimeout(async () => {
            await interaction.editReply({ components: [] });
        }, 30000);

    } catch (error) {
        console.error('Error:', error);
        const errorMessage = error.response.data.message
        
        interaction.reply({ content: errorMessage, ephemeral: true });
    }
}