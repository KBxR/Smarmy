const fs = require('fs');
const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: false,
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

setupDatabase();

module.exports = { Permission, ServerConfig, setupDatabase };