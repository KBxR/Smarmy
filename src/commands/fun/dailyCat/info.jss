const { SlashCommandSubcommandBuilder } = require('discord.js');
const { UserInfo } = require('@database/setup');
const { CatPicture } = require('@database/models');

module.exports = {
    data: new SlashCommandSubcommandBuilder()
        .setName('info')
        .setDescription('Get a users cat info.'),

    async execute(interaction) {

    }
};