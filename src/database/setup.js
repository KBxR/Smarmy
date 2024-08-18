const fs = require('fs');
const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');
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

async function generateUserInfo(userId) {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');

        await UserInfo.sync();
        console.log('User info table is successfully created or already exists');

        // Retrieve the number of cats the user has
        const numberOfCats = await Cat.count({ where: { user_id: userId } });

        let mostRecentCatDate = null;
        if (numberOfCats > 0) {
            // Retrieve the most recent cat date from the database
            const mostRecentCat = await Cat.findOne({
                where: { user_id: userId },
                order: [['date', 'DESC']]
            });
            mostRecentCatDate = mostRecentCat ? format(new Date(mostRecentCat.date), 'dd-MM-yyyy') : null;
        }

        let userInfo = await UserInfo.findOne({ where: { user_id: userId } });
        if (!userInfo) {
            const userInfoTemplatePath = path.join(__dirname, 'userinfo.json');
            const userInfoTemplate = JSON.parse(fs.readFileSync(userInfoTemplatePath, 'utf8'));

            // Set the number of cats and the most recent cat date in the template if numberOfCats is greater than 0
            if (numberOfCats > 0) {
                userInfoTemplate.dailycat.cats = numberOfCats;
                userInfoTemplate.dailycat.lastcat = mostRecentCatDate;
            }

            userInfo = await UserInfo.create({ user_id: userId, info: userInfoTemplate });
            console.log(`User info for user ID ${userId} has been created using the template.`);
        } else {
            // Update the number of cats and the most recent cat date in the existing user info if numberOfCats is greater than 0
            if (numberOfCats > 0) {
                const updatedInfo = { 
                    ...userInfo.info, 
                    dailycat: { 
                        ...userInfo.info.dailycat, 
                        cats: numberOfCats, 
                        lastcat: mostRecentCatDate 
                    } 
                };
                await UserInfo.update({ info: updatedInfo }, { where: { user_id: userId } });
                console.log(`User info for user ID ${userId} has been updated with the number of cats and the most recent cat date.`);
            }
        }
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
}

setupDatabase();

module.exports = { Permission, ServerConfig, setupDatabase, UserInfo, generateUserInfo };