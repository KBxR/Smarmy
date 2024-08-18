const { UserInfo, BotInfo } = require('@database/models');

class DBHandler {
    static async loadUserData(userID) {
        return await UserInfo.findByPk(userID);
    }

    static async saveUserData(userID, data) {
        let user = await User.findByPk(userID);
        if (!user) {
            user = await User.create({ id: userID });
        }
        for (let key in data) {
            user[key] = data[key];
        }
        await user.save();
    }

    static async loadBotInfo(key) {
        return await BotInfo.findByPk(key);
    }

    static async saveBotInfo(key, value) {
        let botInfo = await BotInfo.findByPk(key);
        if (!botInfo) {
            botInfo = await BotInfo.create({ key: key, value: value });
        } else {
            botInfo.value = value;
        }
        await botInfo.save();
    }
}

module.exports = DBHandler;