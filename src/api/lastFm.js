const axios = require('axios');
const { lastFmKey } = require('@config');

async function makeLastFmApiCall(method, params) {
    const baseUrl = `http://ws.audioscrobbler.com/2.0/`;
    const url = `${baseUrl}?method=${method}&api_key=${lastFmKey}&format=json${params}`;
    const res = await axios.get(url);
    return res.data;
}

// USER METHODS

// Gets the user info of a user
async function getLastFmUser(username) {
    const data = await makeLastFmApiCall('user.getinfo', `&user=${username}`);
    return data.user;
}

// Gets the weekly scrobbles of a user
async function getWeeklyScrobbles(username) {
    const data = await makeLastFmApiCall('user.getweeklytrackchart', `&user=${username}`);
    return data.weeklytrackchart.track;
}

// TRACKS METHODS

// Gets the recent tracks of a user
async function getRecentTracks(username, length) {
    length = length || 1;
    const data = await makeLastFmApiCall('user.getRecentTracks', `&user=${username}&nowplaying=true&limit=${length}`);
    return data.recenttracks.track;
}

// Gets the top tracks of a user
async function getTopTracks(username, length, period) {
    length = length || 10;
    period = period || '7day';
    const data = await makeLastFmApiCall('user.gettoptracks', `&user=${username}&limit=${length}&period=${period}`);
    return data.toptracks.track;
}

// ARTIST METHODS

// Gets the weekly top artists of a user
async function getWeeklyTopArtists(username) {
    const data = await makeLastFmApiCall('user.getweeklyartistchart', `&user=${username}`);
    return data.weeklyartistchart.artist;
}

// Gets the top artists of a user
async function getTopArtists(username) {
    const data = await makeLastFmApiCall('user.gettopartists', `&user=${username}`);
    return data.topartists.artist;
}

// Gets the info of an artist
async function getArtistInfo(artist) {
    const data = await makeLastFmApiCall('artist.getinfo', `&artist=${artist}`);
    return data.artist;
}

// Gets the info of an artist with a username
async function getArtistInfoWUsername(artist, username) {
    const data = await makeLastFmApiCall('artist.getinfo', `&artist=${artist}&username=${username}`);
    return data.artist;
}

// ALBUM METHODS

// Gets the top albums of a user
async function getTopAlbums(username, length) {
    length = length || 10;
    const data = await makeLastFmApiCall('user.gettopalbums', `&user=${username}&limit=${length}`);
    return data.topalbums.album;
}

module.exports = { getArtistInfo, getTopTracks, getTopAlbums, getArtistInfoWUsername, getRecentTracks, getLastFmUser, getWeeklyTopArtists, getTopArtists, getWeeklyScrobbles };