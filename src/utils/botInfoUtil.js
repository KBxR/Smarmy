const { BotInfo } = require('@database/models');

async function getBotInfo() {
    try {
        const authorNameEntry = await BotInfo.findOne({ where: { key: 'username' } });
        const authorIconUrlEntry = await BotInfo.findOne({ where: { key: 'avatar' } });
        const statusTypeEntry = await BotInfo.findOne({ where: { key: 'status_type' } });
        const statusNameEntry = await BotInfo.findOne({ where: { key: 'status_name' } });

        const authorName = authorNameEntry ? authorNameEntry.value : 'Default Author Name';
        const authorIconUrl = authorIconUrlEntry ? authorIconUrlEntry.value : null;
        const statusType = statusTypeEntry ? statusTypeEntry.value : 'Playing';
        const statusName = statusNameEntry ? statusNameEntry.value : '';

        return { authorName, authorIconUrl, statusType, statusName };
    } catch (error) {
        console.error('Error fetching bot info:', error);
        return {
            authorName: 'Default Author Name',
            authorIconUrl: null,
            statusType: 'Playing',
            statusName: ''
        };
    }
}

module.exports = { getBotInfo };
