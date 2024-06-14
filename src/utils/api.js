const axios = require('axios');
const { lastFmKey } = require('@config/config');

async function getLastFmUserInfo(username) {
    const res = await axios.get(`http://ws.audioscrobbler.com/2.0/?method=user.getinfo&user=${username}&api_key=${lastFmKey}&format=json`);
    return res.data.user;
}

async function getWeeklyTopArtists(username) {
    const res = await axios.get(`http://ws.audioscrobbler.com/2.0/?method=user.getweeklyartistchart&user=${username}&api_key=${lastFmKey}&format=json`);
    return res.data.weeklyartistchart.artist;
}

async function getTopArtists(username) {
    const res = await axios.get(`http://ws.audioscrobbler.com/2.0/?method=user.gettopartists&user=${username}&api_key=${lastFmKey}&format=json`);
    return res.data.topartists.artist;
}

async function getWeeklyScrobbles(username) {
    const res = await axios.get(`http://ws.audioscrobbler.com/2.0/?method=user.getweeklytrackchart&user=${username}&api_key=${lastFmKey}&format=json`);
    return res.data.weeklytrackchart.track;
}

async function getLastFmUser(username) {
    const res = await axios.get(`http://ws.audioscrobbler.com/2.0/?method=user.getinfo&user=${username}&api_key=${lastFmKey}&format=json`);
    return res.data.user;
}

async function getRecentTrack(username) {
    const res = await axios.get(`http://ws.audioscrobbler.com/2.0/?method=user.getRecentTracks&user=${username}&api_key=${lastFmKey}&format=json&nowplaying=true&limit=1`);
    return res.data.recenttracks.track[0];
}

module.exports = { getLastFmUserInfo, getWeeklyTopArtists, getTopArtists, getWeeklyScrobbles, getLastFmUser, getRecentTrack };