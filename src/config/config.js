const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Access environment variables
const config = {
    token: process.env.BOT_TOKEN,
    clientId: process.env.CLIENT_ID,
    guildId: process.env.GUILD_ID,
    adminId: process.env.ADMIN_ID,
    lastFmKey: process.env.LASTFM_KEY,
    lastFmSecret: process.env.LASTFM_SECRET,
    rebrickKey: process.env.REBRICK_KEY,
    isaacKey: process.env.ISAAC_KEY,
};

module.exports = config;
