const { SlashCommandSubcommandBuilder } = require('discord.js');
const { Client } = require('pg');
const { databasePath } = require('@config');

const client = new Client({
    connectionString: `${databasePath}`,
});

client.connect();

module.exports.data = new SlashCommandSubcommandBuilder()
    .setName('add')
    .setDescription('Add a permission to a user')
    .addUserOption(option =>
        option.setName('user')
            .setDescription('The user to grant permission to')
            .setRequired(true))
    .addStringOption(option =>
        option.setName('permission')
            .setDescription('The permission to grant')
            .setRequired(true)
            .addChoices(
                { name: 'Starboard', value: 'starboard' },
            ));

module.exports.execute = async function handlePermissionAdd(interaction) {
    const user = interaction.options.getUser('user');
    const permission = interaction.options.getString('permission');
    const serverId = interaction.guild.id;

    client.query(`
        INSERT INTO permissions (server_id, user_id, permission_name)
        VALUES ($1, $2, $3)
    `, [serverId, user.id, permission], async (err, res) => {
        if (err) {
            console.error(err);
            await interaction.reply({ content: 'Failed to add permission.', ephemeral: true });
        } else {
            await interaction.reply({ content: `Permission \`${permission}\` added to ${user.tag}.`, ephemeral: true });
        }
    });
};