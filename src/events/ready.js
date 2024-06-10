const { ActivityType,Events } = require('discord.js');
const io = require('socket.io')(3001); // WebSocket server on port 3001
const { User } = require('../models'); // Import User model from models.js
const fs = require('fs');
const path = require('path');

// Load the config
const configPath = path.resolve(__dirname, './config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const statusType = config.status.type

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        const activityTypeMap = {
            Playing: ActivityType.Playing,
            Watching: ActivityType.Watching,
            Streaming: ActivityType.Streaming,
            Listening: ActivityType.Listening
        };

        // Set the bot's activity from config
        client.user.setActivity(config.status.name, { type: activityTypeMap[statusType] });

        // Handle WebSocket connections
        io.on('connection', (socket) => {
            console.log('A user connected');
            socket.on('disconnect', () => {
                console.log('A user disconnected');
            });
        });

        // Sync the model with the database
        try {
            await User.sync();
            console.log('User model synchronized with the database');
        } catch (error) {
            console.error('Error synchronizing User model:', error);
        }

        console.log(`Ready! Logged in as ${client.user.tag}`);
    },
};
