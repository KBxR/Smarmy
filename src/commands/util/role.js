const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const handleRoleCreate = require('./role/create');
const handleRoleGive = require('./role/give');
const handleRoleRemove = require('./role/remove');
const handleRoleIcon = require('./role/icon');

module.exports = {
    category: 'util',
    data: new SlashCommandBuilder()
        .setName('role')
        .setDescription('Role options')
        
        // Role creation subcommand
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('Creates a role with given hex code')
                .addStringOption(option =>
                    option.setName('rolename')
                        .setDescription('Name of the role to create')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('hexcode')
                        .setDescription('Hex color code')
                        .setRequired(true))
                .addAttachmentOption(option =>
                    option.setName('icon')
                        .setDescription('The icon image file (optional)'))
        )
        
        // Role removal subcommand
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Removes a role from a user')
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('Name of the role to remove')
                        .setRequired(true))
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user you want to remove the role from')
                        .setRequired(true))
        )

        // Role icon subcommand
        .addSubcommand(subcommand =>
            subcommand
                .setName('icon')
                .setDescription('Sets the icon of a specified role')
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('The role to set the icon for')
                        .setRequired(true))
                .addAttachmentOption(option =>
                    option.setName('icon')
                        .setDescription('The icon image file')
                        .setRequired(true))
        )
        
        // Role assignment subcommand
        .addSubcommand(subcommand =>
            subcommand
                .setName('give')
                .setDescription('Gives a role to a user')
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('Name of the role to give')
                        .setRequired(true))
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user you want to give the role to')
                        .setRequired(true))
        ),
        
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        
        // Check if the user has MANAGE_ROLES permission
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageRoles, false)) {
            return interaction.reply({ content: 'You do not have permission to manage roles.', ephemeral: true });
        }

        try {
            if (subcommand === 'create') {
                await handleRoleCreate(interaction);
            } else if (subcommand === 'give') {
                await handleRoleGive(interaction);
            } else if (subcommand === 'remove') {
                await handleRoleRemove(interaction);
            } else if (subcommand === 'icon') {
                await handleRoleIcon(interaction);
            }
        } catch (error) {
            console.error('Error executing command:', error);
            interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    },
};
