const { Sequelize, DataTypes } = require('sequelize');
const { databasePath } = require('@config');

// Initialize Sequelize with PostgreSQL
const sequelize = new Sequelize( databasePath, {
  dialect: 'postgres',
  logging: false,
});

// Define your models
const User = sequelize.define('User', {
    userID: {
        type: DataTypes.STRING,
        primaryKey: true,
    },
    lastFMUsername: DataTypes.STRING,
}, {
    timestamps: false,
});

const BotInfo = sequelize.define('BotInfo', {
    key: {
        type: DataTypes.STRING,
        primaryKey: true,
    },
    value: DataTypes.STRING,
}, {
    timestamps: false,
});

// Sync all defined models with the database
sequelize.sync();

module.exports = { User, BotInfo, sequelize };