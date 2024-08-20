const { SlashCommandBuilder } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Play a FLAC file in a voice channel')
        .addStringOption(option =>
            option.setName('file')
                .setDescription('The path to the FLAC file')
                .setRequired(true)),

    async execute(interaction) {
        const filePath = interaction.options.getString('file');

        // Check if the file exists
        if (!fs.existsSync(filePath) || path.extname(filePath) !== '.flac') {
            return interaction.reply({ content: 'Invalid file path or file is not a FLAC file.', ephemeral: true });
        }

        const channel = interaction.member.voice.channel;
        if (!channel) {
            return interaction.reply({ content: 'You need to be in a voice channel to play music.', ephemeral: true });
        }

        const connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator,
        });

        const player = createAudioPlayer();
        const resource = createAudioResource(filePath);

        player.play(resource);
        connection.subscribe(player);

        player.on(AudioPlayerStatus.Playing, () => {
            interaction.reply({ content: `Now playing: ${path.basename(filePath)}` });
        });

        player.on(AudioPlayerStatus.Idle, () => {
            connection.destroy();
        });

        player.on('error', error => {
            console.error('Error:', error);
            interaction.reply({ content: 'An error occurred while playing the file.', ephemeral: true });
            connection.destroy();
        });
    },
};