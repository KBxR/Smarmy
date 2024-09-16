const { SlashCommandSubcommandBuilder } = require('discord.js');
const { Client } = require('pg');
const { databasePath } = require('@config');

const client = new Client({
    connectionString: `${databasePath}`,
});

client.connect();

module.exports = {
    data: new SlashCommandSubcommandBuilder()
        .setName('blacklist')
        .setDescription('Blacklist a user from the Catgacha leaderboard')
        .addStringOption(option =>
            option.setName('user')
                .setDescription('The user to blacklist')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('range')
                .setDescription('The range of the blacklist')
                .setRequired(true)
                .addChoices(
                    { name: 'Global', value: 'global' },
                    { name: 'Server', value: 'server' }
                )
        ),

    async execute(interaction) {
        const user = interaction.options.getString('user');
        const range = interaction.options.getString('range');
        const serverId = range === 'server' ? interaction.guild.id : null;

        try {
            await client.query(`
                INSERT INTO blacklist (server_id, user_id)
                VALUES ($1, $2)
                ON CONFLICT DO NOTHING
            `, [serverId, user]);

            await interaction.reply({ content: `${user.username} has been blacklisted from the ${range} leaderboard.`, ephemeral: true });
        } catch (error) {
            console.error('Error blacklisting user:', error);
            await interaction.reply({ content: 'An error occurred while blacklisting the user. Please try again later.', ephemeral: true });
        }
    }
};