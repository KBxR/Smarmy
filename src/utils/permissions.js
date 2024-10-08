const { Client } = require('pg');
const { databasePath } = require('@config');
const getServerConfig = require('@utils/getServerConfig');

const client = new Client({
    connectionString: `${databasePath}`,
});

client.connect();

async function hasPermission(serverId, userId, permissionName) {
    // Fetch the latest server configuration
    const serverConfig = await getServerConfig(serverId);
    const superuserConfig = serverConfig.superUser;

    // Check if superuser is enabled
    if (superuserConfig.enabled) {
        // Check if the user has the superuser permission
        const superUserRes = await client.query(`
            SELECT 1 FROM permissions
            WHERE server_id = $1 AND user_id = $2 AND permission_name = 'superUser'
        `, [serverId, userId]);

        if (superUserRes.rowCount > 0) {
            return true;
        }
    } else {
        console.log('Superuser feature is not enabled.');
    }

    // Check if the user has the specific permission
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