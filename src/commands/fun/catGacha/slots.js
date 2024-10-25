const { SlashCommandSubcommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage, registerFont } = require('canvas');
const { fetchCatPicture } = require('@api/catApi');
const path = require('path');
const fs = require('fs');
const { Client } = require('pg');
const { getRandomHexColor } = require('@utils');
const { catKey, databasePath } = require('@config');
const { UserInfo } = require('@database/setup');

const client = new Client({
    connectionString: `${databasePath}`,
});

client.connect();

// Register the Noto Color Emoji font
registerFont(path.join(__dirname, '../../../utils/Twemoji.ttf'), { family: 'Twitter Color Emoji' });

module.exports = {
    data: new SlashCommandSubcommandBuilder()
        .setName('slots')
        .setDescription('Spin the slot machine to get a random cat picture'),

    async execute(interaction) {
        const userId = interaction.user.id;

        // CONFIG
        const COST = 3;
        const CHERRY_VALUE = 1;
        const CHERRY_MULTIPLIER = 2;
        const THREE_WATERMELONS_REWARD = 20;

        // Fetch user info
        let userInfo = await UserInfo.findOne({ where: { user_id: userId } });
        if (!userInfo) {
            return interaction.reply({ content: 'User information not found.', ephemeral: true });
        }

        const userCatBucks = userInfo.info.dailycat.catBucks || 0;
        if (userCatBucks < COST) {
            return interaction.reply({ content: 'You do not have enough Cat Bucks to play the slots.', ephemeral: true });
        }

        // Deduct the cost from user's Cat Bucks
        const updatedInfo = {
            ...userInfo.info,
            dailycat: {
                ...userInfo.info.dailycat,
                catBucks: userCatBucks - COST
            }
        };
        await UserInfo.update({ info: updatedInfo }, { where: { user_id: userId } });

        // Constants
        const WIDTH = 520;
        const HEIGHT = 260;
        const SLOT_ITEMS = ['🍒', '🍋', '🔔', '🍉', '⭐', '🍇'];
        const FONT_SIZE = 50;
        const TEMP_DIR = path.join(__dirname, '../../../temp');
        const BACKGROUND_PATH = path.join(__dirname, '../../../utils/slot.png');

        // Ensure the temp directory exists
        if (!fs.existsSync(TEMP_DIR)) {
            fs.mkdirSync(TEMP_DIR, { recursive: true });
        }

        // Function to create the slot machine image
        const createSlotMachineImage = async (slot1, slot2, slot3) => {
            const canvas = createCanvas(WIDTH, HEIGHT);
            const ctx = canvas.getContext('2d');

            // Load background image
            const background = await loadImage(BACKGROUND_PATH);
            ctx.drawImage(background, 0, 0, WIDTH, HEIGHT);

            // Set font
            ctx.font = `${FONT_SIZE}px 'Twitter Color Emoji'`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = 'black';

            // Draw emojis
            ctx.fillText(slot1, WIDTH / 4, HEIGHT / 2);
            ctx.fillText(slot2, WIDTH / 2, HEIGHT / 2);
            ctx.fillText(slot3, (3 * WIDTH) / 4, HEIGHT / 2);

            return canvas.toBuffer();
        };

        // Generate the final frame with the result
        const resultSlot1 = SLOT_ITEMS[Math.floor(Math.random() * SLOT_ITEMS.length)];
        const resultSlot2 = SLOT_ITEMS[Math.floor(Math.random() * SLOT_ITEMS.length)];
        const resultSlot3 = SLOT_ITEMS[Math.floor(Math.random() * SLOT_ITEMS.length)];
        const resultArray = [resultSlot1, resultSlot2, resultSlot3];
        const resultImageBuffer = await createSlotMachineImage(resultSlot1, resultSlot2, resultSlot3);

        // Check if the result is a win
        const isWin = resultSlot1 === resultSlot2 && resultSlot2 === resultSlot3;

        // Calculate the cherry reward
        const cherryCount = resultArray.filter(slot => slot === '🍒').length;
        const cherryReward = cherryCount * CHERRY_VALUE * CHERRY_MULTIPLIER;

        // Check for three watermelons
        const threeWatermelons = resultArray.every(slot => slot === '🍉');
        let additionalReward = 0;

        if (threeWatermelons) {
            additionalReward = THREE_WATERMELONS_REWARD;
        }

        // Update the user's cat bucks with the cherry reward and additional reward
        const newCatBucks = updatedInfo.dailycat.catBucks + cherryReward + additionalReward;
        const finalUpdatedInfo = {
            ...updatedInfo,
            dailycat: {
                ...updatedInfo.dailycat,
                catBucks: newCatBucks
            }
        };
        await UserInfo.update({ info: finalUpdatedInfo }, { where: { user_id: userId } });

        // Save the image
        const imagePath = path.join(TEMP_DIR, 'slot_machine.png');
        fs.writeFileSync(imagePath, resultImageBuffer);

        // Read the generated image
        const imageAttachment = new AttachmentBuilder(imagePath);

        // Fetch a random cat picture if the result is a win or three watermelons
        if (isWin || threeWatermelons) {
            const pictureUrl = await fetchCatPicture(catKey);
            const insertRes = await client.query(`
                INSERT INTO cat_pictures (user_id, picture_url, fetched_at)
                VALUES ($1, $2, NOW())
                RETURNING id
            `, [userId, pictureUrl]);
            const catId = insertRes.rows[0].id;

            const randomColor = getRandomHexColor();
            const embed = new EmbedBuilder()
                .setColor(randomColor)
                .setTitle('🎰 Slot Machine Result 🎰')
                .setDescription(`You spun the slot machine and won a cat picture!`)
                .setImage(pictureUrl)
                .setFooter({ text: `Cat ID: ${catId}` })
                .setTimestamp();

                if (cherryReward > 0) {
                    embed.addFields({name: 'You also earned', value: `${cherryReward} Cat Bucks`, inline: true})
                }

            await interaction.reply({ embeds: [embed], files: [imageAttachment], ephemeral: false });
        } else {
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('🎰 Slot Machine Result 🎰')
                .setDescription(`You spun the slot machine and did not win. Better luck next time!`)
                .setTimestamp();

                if (cherryReward > 0) {
                    embed.addFields({name: 'You also earned', value: `${cherryReward} Cat Bucks`, inline: true})
                }

            await interaction.reply({ embeds: [embed], files: [imageAttachment], ephemeral: false });
        }

        // Clean up the generated image
        fs.unlinkSync(imagePath);
    }
};