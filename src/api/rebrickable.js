const axios = require('axios');
const { rebrickKey } = require('@config');

async function makeRebrickableApiCall(method, params) {
    const baseUrl = `https://rebrickable.com/api/v3/lego/`;
    const url = `${baseUrl}${method}/?key=${rebrickKey}${params}`;
    const res = await axios.get(url);
    return res.data;
}

async function getMinifigSearch(search) {
    const data = await makeRebrickableApiCall('minifigs', `&search=${search}`);
    return data.results;
}

async function getPartSearch(search) {
    const data = await makeRebrickableApiCall('parts', `&search=${search}`);
    return data.results;
}

module.exports = { getMinifigSearch, getPartSearch };