const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

// Initialize Sequelize with SQLite
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, 'database.sqlite'),
  logging: false,
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
