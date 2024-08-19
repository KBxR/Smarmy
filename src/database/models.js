const { Sequelize, DataTypes } = require('sequelize');
const { databasePath } = require('@config');

// Initialize Sequelize with PostgreSQL
const sequelize = new Sequelize(databasePath, {
    dialect: 'postgres',
    logging: false,
});

// Define your models
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

const CatStore = sequelize.define('CatStore', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    price: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    picture_url: {
        type: DataTypes.TEXT,
        allowNull: false,
    }
}, {
    tableName: 'cat_store',
    timestamps: false,
});

const SoldCats = sequelize.define('SoldCats', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    price: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    picture_url: {
        type: DataTypes.TEXT,
        allowNull: false,
    }
}, {
    tableName: 'sold_cats',
    timestamps: false,
});

const Codes = sequelize.define('Codes', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    code: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    value: {
        type: DataTypes.JSONB,
        allowNull: false,
    }
}, {
    tableName: 'codes',
    timestamps: false,
});

const CodeUsage = sequelize.define('CodeUsage', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    code: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    user_id: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    used_at: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.NOW,
    }
}, {
    tableName: 'code_usage',
    timestamps: false,
});

// Sync all defined models with the database
sequelize.sync();

module.exports = { BotInfo, CatPicture, sequelize, CatStore, SoldCats, Codes, CodeUsage };