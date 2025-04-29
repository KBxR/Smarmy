const { SlashCommandSubcommandBuilder, AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('canvas');
const { Client } = require('pg');
const { databasePath } = require('@config');

const client = new Client({
    connectionString: `${databasePath}`,
});

client.connect();

const BACKGROUND_URL = 'https://i.imgur.com/zaJvT8G.png';

const CAT_POSITIONS = [
    { x: 608, y: 1391, size: 300 },
    { x: 1211, y: 573, size: 300 },
    { x: 550, y: 360, size: 300 },
];

module.exports = {
    data: new SlashCommandSubcommandBuilder()
        .setName('tree')
        .setDescription('User Cat tree!'),

    async execute(interaction) {
        await interaction.deferReply();

        const userId = interaction.user.id;
        let catIds = [];
        let pictures = [];

        try {
            // Step 1: Fetch catsOnTree array from user_info
            const infoRes = await client.query(`
                SELECT info
                FROM user_info
                WHERE user_id = $1
            `, [userId]);

            if (infoRes.rowCount === 0 || !infoRes.rows[0].info?.tree?.catsOnTree) {
                await interaction.editReply('You don’t have any cats on your tree yet!');
                return;
            }

            catIds = infoRes.rows[0].info.tree.catsOnTree;

            if (!Array.isArray(catIds) || catIds.length === 0) {
                await interaction.editReply('Your cat tree is currently empty.');
                return;
            }

            // Step 2: Fetch the corresponding cat pictures
            const picRes = await client.query(`
                SELECT id, picture_url, fetched_at
                FROM cat_pictures
                WHERE id = ANY($1::int[])
            `, [catIds]);

            if (picRes.rowCount === 0) {
                await interaction.editReply('Could not find pictures for the cats on your tree.');
                return;
            }

            // Maintain the order of cats based on the user's saved tree
            const pictureMap = Object.fromEntries(picRes.rows.map(row => [row.id, row]));
            pictures = catIds
                .map(id => pictureMap[parseInt(id)])
                .filter(Boolean)
                .slice(0, 3); // Ensure max 3 cats

        } catch (error) {
            console.error('Error loading cat tree data:', error);
            await interaction.editReply('Error fetching your cat tree.');
            return;
        }

        // Step 3: Draw the tree
        const canvasWidth = 1800;
        const canvasHeight = 1800;
        const canvas = createCanvas(canvasWidth, canvasHeight);
        const ctx = canvas.getContext('2d');

        try {
            const background = await loadImage(BACKGROUND_URL);
            ctx.drawImage(background, 0, 0, canvasWidth, canvasHeight);
        } catch (error) {
            console.error('Failed to load background image:', error);
            ctx.fillStyle = '#f0e6f6';
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        }

        const fixedWidth = 300;

        for (let i = 0; i < pictures.length; i++) {
            const cat = pictures[i];
            const { x, y, size } = CAT_POSITIONS[i];

            try {
                const catImage = await loadImage(cat.picture_url);
                ctx.drawImage(catImage, x, y, fixedWidth, size); // Width fixed, height from size
            } catch (err) {
                console.error(`Error loading image for cat ID ${cat.id}:`, err);
            }
        }

        const attachment = new AttachmentBuilder(canvas.toBuffer('image/png'), { name: 'cat-tree.png' });
        await interaction.editReply({ files: [attachment] });
    }
};
