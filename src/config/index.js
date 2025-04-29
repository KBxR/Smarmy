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
    pinChannel: process.env.PIN_CHANNEL,
    pinServer: process.env.PIN_SERVER,
    databasePath: process.env.DATABASE_URL,
    catKey: process.env.CAT_KEY,
    imgurKey: process.env.IMGUR_KEY,
};

module.exports = config;
