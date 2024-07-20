const { SlashCommandSubcommandBuilder, EmbedBuilder } = require('discord.js');
const { getBotInfo } = require('@utils');

module.exports.data = new SlashCommandSubcommandBuilder()
    .setName('give')
    .setDescription('Gives a role to a user')
    .addRoleOption(option =>
        option.setName('role')
            .setDescription('Name of the role to give')
            .setRequired(true))
    .addUserOption(option =>
        option.setName('user')
            .setDescription('The user you want to give the role to')
            .setRequired(true));

module.exports.execute = async function handleRoleGive(interaction) {
    const role = interaction.options.getRole('role');
    const user = interaction.options.getUser('user');
    const member = interaction.options.getMember('user');

    const { authorName, authorIconUrl } = await getBotInfo();

    // Assign the role to the user
    await member.roles.add(role);

    // Create an embed message to confirm role assignment
    const roleGiveEmbed = new EmbedBuilder()
        .setColor(role.color)
        .setTitle(`Gave ${user.username} a role`)
        .setAuthor({ 
            name: authorName, 
            iconURL: authorIconUrl 
        })
        .addFields(
            { name: 'Role Name:', value: `<@&${role.id}>`, inline: false },
            { name: 'User:', value: `<@${user.id}>`, inline: false }
        );

    interaction.reply({ embeds: [roleGiveEmbed] });
}
