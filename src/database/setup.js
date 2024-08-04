const { Client } = require('pg');

const client = new Client({
    connectionString: process.env.DATABASE_URL,
});

client.connect();

function setupDatabase(serverId) {
    client.query(`
        CREATE TABLE IF NOT EXISTS whitelisted_permissions (
            server_id TEXT,
            user_id TEXT,
            command_name TEXT,
            PRIMARY KEY (server_id, user_id, command_name)
        )
    `, (err, res) => {
        if (err) {
            console.error(err);
        } else {
            console.log('Table is successfully created or already exists');
        }
    });

    if (serverId) {
        client.query(`
            INSERT INTO whitelisted_permissions (server_id, user_id, command_name)
            VALUES ($1, '', '')
            ON CONFLICT (server_id, user_id, command_name) DO NOTHING
        `, [serverId], (err, res) => {
            if (err) {
                console.error(err);
            } else {
                console.log(`Server ID ${serverId} is logged`);
            }
        });
    }
}

module.exports = { setupDatabase };