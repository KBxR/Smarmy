const path = require('path');
const axios = require('axios');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const fs = require('fs');
const sodium = require('libsodium-wrappers');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Play a FLAC file in a voice channel')
        .addAttachmentOption(option =>
            option.setName('file')
                .setDescription('The FLAC file to play')
                .setRequired(true)),

    async execute(interaction) {
        await sodium.ready; // Ensure sodium is ready
        const attachment = interaction.options.getAttachment('file');

        // Check if the file is a FLAC file
        if (path.extname(attachment.name) !== '.flac') {
            return interaction.reply({ content: 'The file is not a FLAC file.', ephemeral: true });
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

        // Download the file
        const response = await axios.get(attachment.url, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(response.data, 'binary');
        const tempFilePath = path.join(__dirname, 'temp.flac');
        fs.writeFileSync(tempFilePath, buffer);

        const resource = createAudioResource(tempFilePath);

        player.play(resource);
        connection.subscribe(player);

        player.on(AudioPlayerStatus.Playing, () => {
            interaction.reply({ content: `Now playing: ${attachment.name}` });
        });

        player.on(AudioPlayerStatus.Idle, () => {
            connection.destroy();
            fs.unlinkSync(tempFilePath); // Clean up the temporary file
        });

        player.on('error', error => {
            console.error('Error:', error);
            interaction.reply({ content: 'An error occurred while playing the file.', ephemeral: true });
            connection.destroy();
            fs.unlinkSync(tempFilePath); // Clean up the temporary file
        });
    },
};