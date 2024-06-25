async function resolveUsername({ username, mention, userID, interaction, DBHandler }) {
    if (username === null && mention !== null) {
        userID = mention.id;
        const userData = await DBHandler.loadUserData(userID);
        if (userData) {
            username = userData.lastFMUsername;
        } else {
            return { error: 'No username found for the mentioned user.' };
        }
    } else if (username !== null && mention === null) {
        // Use the provided username, nothing to do here
    } else if (username === null && mention === null) {
        const userData = await DBHandler.loadUserData(userID);
        if (userData) {
            username = userData.lastFMUsername;
        } else {
            return { error: 'Please provide either a username, mention a member, or set your username with the command `/lastfm username`.' };
        }
    } else {
        return { error: 'Please provide either a LastFM username or mention a member, not both.' };
    }

    return { username };
}
module.exports = resolveUsername;