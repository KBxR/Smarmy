const axios = require('axios');
const { lastFmKey, rebrickKey} = require('@config/config');

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

async function getArtistInfo(artist) {
    const res = await axios.get(`http://ws.audioscrobbler.com/2.0/?method=artist.getinfo&artist=${artist}&api_key=${lastFmKey}&format=json`);
    return res.data.artist;
}

async function getArtistInfoWUsername(artist, username) {
    const res = await axios.get(`http://ws.audioscrobbler.com/2.0/?method=artist.getinfo&artist=${artist}&api_key=${lastFmKey}&username=${username}&format=json`);
    return res.data.artist;
}

//gets api data from rebrickable
async function getRebrickableMinifigSearch(search) {
    const res = await axios.get(`https://rebrickable.com/api/v3/lego/minifigs/?search=${search}&key=${rebrickKey}`);
    return res.data.results;
}

module.exports = { getWeeklyTopArtists, getTopArtists, getWeeklyScrobbles, getLastFmUser, getRecentTrack, getArtistInfo, getArtistInfoWUsername, getRebrickableMinifigSearch };