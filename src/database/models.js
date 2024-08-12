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

const CatPicture = sequelize.define('CatPicture', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    user_id: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    picture_url: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    fetched_at: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.NOW,
    },
}, {
    tableName: 'cat_pictures',
    timestamps: false,
});

// Sync all defined models with the database
sequelize.sync();

module.exports = { User, BotInfo, CatPicture, sequelize };