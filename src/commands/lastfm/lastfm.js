const { SlashCommandBuilder } = require('discord.js');
const handleRecent = require('./subcommands/recent');
const handleList = require('./subcommands/list');
const handleUsername = require('./subcommands/username');
const handleInfo = require('./subcommands/info');

module.exports = {
    category: 'lastfm',
    data: new SlashCommandBuilder()
        .setName('lastfm')
        .setDescription('LastFM Options')
        
        // Recent Scrobble Subcommand
        .addSubcommand(subcommand =>
            subcommand
                .setName('recent')
                .setDescription('Gets your most recent scrobble on LastFM')
                .addStringOption(option =>
                    option.setName('username')
                        .setDescription('LastFM Username'))
                .addUserOption(option =>
                    option.setName('member')
                        .setDescription('User in server to check'))
        )
        
        // Recent Scrobble Subcommand
        .addSubcommand(subcommand =>
            subcommand
                .setName('username')
                .setDescription('Adds a LastFM username to your account')
                .addStringOption(option =>
                    option.setName('username')
                        .setDescription('LastFM Username')
                        .setRequired(true))
        )

        // Recent Scrobble Subcommand
        .addSubcommand(subcommand =>
            subcommand
                .setName('info')
                .setDescription('Gets a users info on LastFM')
                .addStringOption(option =>
                    option.setName('username')
                        .setDescription('LastFM Username'))
                .addUserOption(option =>
                    option.setName('member')
                        .setDescription('User in server to check'))
        )

        // List of recent Scrobbles subcommand
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('Gives a list of most recent tracks')
                .addStringOption(option =>
                    option.setName('username')
                        .setDescription('LastFM Username'))

                .addStringOption(option =>
                    option.setName('length')
                        .setDescription('How many tracks you want displayed (Max length is 12)'))
        ),
        
    // Subcommand handler
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        try {
            if (subcommand === 'recent') {
                await handleRecent(interaction);
            } else if (subcommand === 'list') {
                await handleList(interaction);
            } else if (subcommand === 'username') {
                await handleUsername(interaction);
            } else if (subcommand === 'info') {
                await handleInfo(interaction);
            }

        } catch (error) {
            console.error('Error executing command:', error);
            interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    },
};