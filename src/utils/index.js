const { getBotInfo } = require('@utils/botInfoUtil');
const DBHandler = require('@utils/DBHandler');
const { getRandomHexColor } = require('@utils/randomColor');

let randomColor = getRandomHexColor();

module.exports = {
    DBHandler,
    getBotInfo,
    // Gets a random color on startup and uses it for the bot's embeds
    randomColor,
    // Use if you want a random color for each embed
    getRandomHexColor
};