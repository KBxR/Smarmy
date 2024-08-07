const { getBotInfo } = require('@utils/botInfoUtil');
const DBHandler = require('@utils/DBHandler');
const { getRandomHexColor } = require('@utils/randomColor');

let randomColor = getRandomHexColor();

module.exports = {
    DBHandler,
    getBotInfo,
    randomColor
};