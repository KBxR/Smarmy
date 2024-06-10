const { EmbedBuilder } = require('discord.js');
const axios = require('axios');
const { User } = require('../../../models');
const config = require('../../../config');
const lastFmKey = config.lastFmKey;

module.exports = async function handleUsername(interaction) {
    const username = interaction.options.getString('username');
    const userID = interaction.user.id;

    try {
        // Update or create the user record in the database
        let user = await User.findByPk(userID);
        if (!user) {
            user = await User.create({ userID: userID, lastFMUsername: username });
        } else {
            user.lastFMUsername = username;
            await user.save();
        }

        // Fetch user info from Last.fm
        const resUser = await axios.get(`http://ws.audioscrobbler.com/2.0/?method=user.getinfo&user=${username}&api_key=${lastFmKey}&format=json`);
        if (!resUser.data.user) {
            return interaction.reply({ content: 'The Last.fm username does not exist.', ephemeral: true });
        }

        const userInfo = resUser.data.user;
        const profilePic = userInfo.image[userInfo.image.length - 1]['#text'];
        const scrobbleCount = userInfo.playcount;
        const accountCreationDate = new Date(userInfo.registered['#text'] * 1000).toLocaleDateString();

        // Create the embed
        const embed = new EmbedBuilder()
            .setColor('#e4141e')
            .setTitle('Last.fm Username Added/Updated')
            .setAuthor({ name: username, iconURL: profilePic, url: userInfo.url })
            .addFields(
                { name: 'Username', value: username, inline: true },
                { name: 'Scrobble Count', value: scrobbleCount.toString(), inline: true },
                { name: 'Account Creation Date', value: accountCreationDate, inline: true }
            )
            .setThumbnail(profilePic)
            .setDescription(`Your Last.fm username has been saved/updated to \`${username}\`.`);

        interaction.reply({ embeds: [embed], ephemeral: true });

    } catch (error) {
        console.error('Error:', error);
        const detailedErrorUserId = '327885496036622347';
        const errorMessage = userID === detailedErrorUserId && error.response && error.response.data && error.response.data.message
            ? `An error occurred: ${error.response.data.message}`
            : 'An error occurred, please try again later.';
        
        interaction.reply({ content: errorMessage, ephemeral: true });
    }
};
