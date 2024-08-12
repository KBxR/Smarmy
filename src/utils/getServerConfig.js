const { ServerConfig } = require('@database/setup');

async function getServerConfig(serverId) {
    try {
        const config = await ServerConfig.findOne({
            where: { server_id: serverId },
            attributes: ['config']
        });
        if (config) {
            return config.dataValues.config;
        } else {
            console.log('No server config found for serverId:', serverId);
            return null;
        }
    } catch (error) {
        console.error('Error fetching server config:', error);
        return null;
    }
}

module.exports = getServerConfig;