const { Client } = require('pg');
const { databasePath } = require('@config');

const client = new Client({
    connectionString: `${databasePath}`,
});

client.connect();

async function hasPermission(serverId, userId, permissionName) {
    const res = await client.query(`
        SELECT 1 FROM permissions
        WHERE server_id = $1 AND user_id = $2 AND permission_name = $3
    `, [serverId, userId, permissionName]);

    return res.rowCount > 0;
}

async function addPermission(serverId, userId, permissionName) {
    await client.query(`
        INSERT INTO permissions (server_id, user_id, permission_name)
        VALUES ($1, $2, $3)
    `, [serverId, userId, permissionName]);
}

async function removePermission(serverId, userId, permissionName) {
    await client.query(`
        DELETE FROM permissions
        WHERE server_id = $1 AND user_id = $2 AND permission_name = $3
    `, [serverId, userId, permissionName]);
}

module.exports = {
    hasPermission,
    addPermission,
    removePermission,
};