const { SlashCommandSubcommandBuilder, EmbedBuilder } = require('discord.js');
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

    try {
        
        let res;
        if (name) {
            res = await getIsaacItemName(name);
        } else if (id) {
            res = await getIsaacItemID(id);
        } else {
            return interaction.reply({ content: 'Please provide an item name or ID.', ephemeral: true });
        }

        const itemEmbed = new EmbedBuilder()
            .setColor('#e4141e')
            .setTitle(`${res[0].name}`)
            .setURL(`https://bindingofisaacrebirth.fandom.com/wiki/${res[0].name.replace(/ /g, '_')}`)
            .setThumbnail(res[0].image);

            // After setting the thumbnail for itemEmbed
            if (res[0].dlc !== "none") {
                let dlcName;
                switch (res[0].dlc) {
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
                        dlcName = ""; // In case there's an unexpected value
                }
                if (dlcName) {
                    itemEmbed.addFields({ name: '**DLC**', value: dlcName, inline: true });
                }
            }
            
            itemEmbed.addFields({ name: '**ID**', value: `${res[0].id}`, inline: true })
            itemEmbed.addFields({ name: '**Description**', value: `${res[0].description}`, inline: false })

        interaction.reply({ embeds: [itemEmbed] });

    } catch (error) {
        console.error('Error:', error);
        const errorMessage = error.response.data.message
        
        interaction.reply({ content: errorMessage, ephemeral: true });
    }
}