const axios = require('axios');
const { lastFmKey } = require('@config');

async function makeLastFmApiCall(method, params) {
    const baseUrl = `http://ws.audioscrobbler.com/2.0/`;
    const url = `${baseUrl}?method=${method}&api_key=${lastFmKey}&format=json${params}`;
    const res = await axios.get(url);
    return res.data;
}

async function getWeeklyTopArtists(username) {
    const data = await makeLastFmApiCall('user.getweeklyartistchart', `&user=${username}`);
    return data.weeklyartistchart.artist;
}

async function getTopArtists(username) {
    const data = await makeLastFmApiCall('user.gettopartists', `&user=${username}`);
    return data.topartists.artist;
}

async function getWeeklyScrobbles(username) {
    const data = await makeLastFmApiCall('user.getweeklytrackchart', `&user=${username}`);
    return data.weeklytrackchart.track;
}

async function getLastFmUser(username) {
    const data = await makeLastFmApiCall('user.getinfo', `&user=${username}`);
    return data.user;
}

async function getRecentTracks(username, length) {
    length = length || 1;
    const data = await makeLastFmApiCall('user.getRecentTracks', `&user=${username}&nowplaying=true&limit=${length}`);
    return data.recenttracks.track;
}

async function getArtistInfo(artist) {
    const data = await makeLastFmApiCall('artist.getinfo', `&artist=${artist}`);
    return data.artist;
}

async function getArtistInfoWUsername(artist, username) {
    const data = await makeLastFmApiCall('artist.getinfo', `&artist=${artist}&username=${username}`);
    return data.artist;
}

async function getTopTracks(username) {
    const data = await makeLastFmApiCall('user.gettoptracks', `&user=${username}&limit=10`);
    return data.toptracks.track;
}

async function getTopAlbums(username, length) {
    length = length || 10;
    const data = await makeLastFmApiCall('user.gettopalbums', `&user=${username}&limit=${length}`);
    return data.topalbums.album;
}

module.exports = { getArtistInfo, getTopTracks, getTopAlbums, getArtistInfoWUsername, getRecentTracks, getLastFmUser, getWeeklyTopArtists, getTopArtists, getWeeklyScrobbles };