const botInfoUtil = require('@utils/botInfoUtil');
const DBHandler = require('@utils/DBHandler');
const randomColor = require('@utils/randomColor');
const resolveUsername = require('../commands/lastfm/utils/usernameResolver');

module.exports = {
    DBHandler,
    botInfoUtil,
    randomColor,
    resolveUsername
};