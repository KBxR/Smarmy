const fs = require('fs');
const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');
const { CatPicture } = require('./models');
const { format } = require('date-fns');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: false,
});

const UserInfo = sequelize.define('UserInfo', {
    user_id: {
        type: DataTypes.STRING,
        primaryKey: true,
    },
    info: {
        type: DataTypes.JSONB,
        allowNull: false,
    },
}, {
    tableName: 'user_info',
    timestamps: false,
});

const Permission = sequelize.define('Permission', {
    server_id: {
        type: DataTypes.STRING,
        primaryKey: true,
    },
    user_id: {
        type: DataTypes.STRING,
        primaryKey: true,
    },
    permission_name: {
        type: DataTypes.STRING,
        primaryKey: true,
    },
}, {
    tableName: 'permissions',
    timestamps: false,
    primaryKey: ['server_id', 'user_id', 'permission_name'],
});

const ServerConfig = sequelize.define('ServerConfig', {
    server_id: {
        type: DataTypes.STRING,
        primaryKey: true,
    },
    config: {
        type: DataTypes.JSONB,
        allowNull: false,
    },
}, {
    tableName: 'server_config',
    timestamps: false,
});

async function setupDatabase(serverId) {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');

        await Permission.sync();
        console.log('Permissions table is successfully created or already exists');

        await ServerConfig.sync();
        console.log('Server config table is successfully created or already exists');

        await UserInfo.sync();
        console.log('User info table is successfully created or already exists');

        if (serverId) {
            let config = await ServerConfig.findOne({ where: { server_id: serverId } });
            if (!config) {
                const configTemplatePath = path.join(__dirname, 'config.json');
                const configTemplate = JSON.parse(fs.readFileSync(configTemplatePath, 'utf8'));

                config = await ServerConfig.create({ server_id: serverId, config: configTemplate });
                console.log(`Config for server ID ${serverId} has been created using the template.`);
            } else {
                const configTemplatePath = path.join(__dirname, 'config.json');
                const configTemplate = JSON.parse(fs.readFileSync(configTemplatePath, 'utf8'));

                const updatedConfig = { ...configTemplate, ...config.config };
                await ServerConfig.update({ config: updatedConfig }, { where: { server_id: serverId } });
                console.log(`Config for server ID ${serverId} has been updated with missing fields.`);
            }
        }
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
}

async function authenticateDatabase() {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
}

async function syncUserInfoTable() {
    await UserInfo.sync();
    console.log('User info table is successfully created or already exists');
}

async function getNumberOfCats(userId) {
    return await CatPicture.count({ where: { user_id: userId } });
}

async function getMostRecentCatDate(userId) {
    const mostRecentCat = await CatPicture.findOne({
        where: { user_id: userId },
        order: [['fetched_at', 'DESC']]
    });

    if (mostRecentCat && mostRecentCat.date) {
        const date = new Date(mostRecentCat.date);
        if (!isNaN(date.getTime())) {
            return format(date, 'dd-MM-yyyy');
        }
    }
    return null;
}

async function getUserInfo(userId) {
    return await UserInfo.findOne({ where: { user_id: userId } });
}

async function createUserInfo(userId, numberOfCats, mostRecentCatDate) {
    const userInfoTemplatePath = path.join(__dirname, 'userinfo.json');
    const userInfoTemplate = JSON.parse(fs.readFileSync(userInfoTemplatePath, 'utf8'));

    if (numberOfCats > 0) {
        userInfoTemplate.dailycat.cats = numberOfCats;
        userInfoTemplate.dailycat.lastcat = mostRecentCatDate;
        userInfoTemplate.dailycat.catBucks = numberOfCats;
    }

    return await UserInfo.create({ user_id: userId, info: userInfoTemplate });
}

async function updateUserInfo(userId, userInfo, numberOfCats, mostRecentCatDate) {
    const updatedInfo = {
        ...userInfo.info,
        dailycat: {
            ...userInfo.info.dailycat,
            cats: numberOfCats,
            lastcat: mostRecentCatDate,
            catBucks: numberOfCats
        }
    };
    await UserInfo.update({ info: updatedInfo }, { where: { user_id: userId } });
}

async function generateUserInfo(userId, serverId) {
    try {
        await authenticateDatabase();
        await syncUserInfoTable();

        const numberOfCats = await getNumberOfCats(userId);
        const mostRecentCatDate = numberOfCats > 0 ? await getMostRecentCatDate(userId) : null;

        let userInfo = await getUserInfo(userId);
        if (!userInfo) {
            userInfo = await createUserInfo(userId, numberOfCats, mostRecentCatDate);
            console.log(`User info for user ID ${userId} has been created using the template.`);

            let serverConfig = await ServerConfig.findOne({ where: { server_id: serverId } });
            if (serverConfig) {
                serverConfig.users = [...new Set([...serverConfig.users, userId])]; // Ensure no duplicates
                await serverConfig.save();
                console.log(`User ID ${userId} has been added to ServerConfig.users array for server ID ${serverId}.`);
            } else {
                console.log(`ServerConfig for server ID ${serverId} not found.`);
            }
        } else if (numberOfCats > 0) {
            await updateUserInfo(userId, userInfo, numberOfCats, mostRecentCatDate);
            console.log(`User info for user ID ${userId} has been updated with the number of cats and the most recent cat date.`);
        }
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
}

setupDatabase();

module.exports = { Permission, ServerConfig, setupDatabase, UserInfo, generateUserInfo };