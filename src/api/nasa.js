const axios = require('axios');
const { nasaKey } = require('@config');

async function makeNASAApiCall(method, params) {
    const baseUrl = `https://api.nasa.gov/planetary/`;
    const url = `${baseUrl}${method}/?api_key=${nasaKey}${params}`;
    const res = await axios.get(url);
    return res.data;
}

async function getAPOD() {
    const data = await makeNASAApiCall('apod', `&thumbs=true`);
    return data;
}


module.exports = { getAPOD };