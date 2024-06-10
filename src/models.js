const { Sequelize, DataTypes } = require('sequelize');

// Initialize Sequelize with SQLite
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite', // SQLite file path
});

// Define your models
const User = sequelize.define('User', {
    userID: {
        type: DataTypes.STRING,
        primaryKey: true,
    },
    lastFMUsername: DataTypes.STRING,
});

const BotInfo = sequelize.define('BotInfo', {
    key: {
        type: DataTypes.STRING,
        primaryKey: true,
    },
    value: DataTypes.STRING,
});

// Sync all defined models with the database
sequelize.sync();

module.exports = { User, BotInfo, sequelize };
