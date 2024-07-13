const axios = require('axios');

async function makeIsaacApiCall(method, params) {
    const baseUrl = `http://api.sicklesheen.xyz/api/item/`;
    const url = `${baseUrl}?method=${method}&format=json${params}`;
    const res = await axios.get(url);
    return res.data;
}

async function getItemName(name) {
    const data = await makeIsaacApiCall('item', `&name=${name}`);
    return data;
}

async function getItemID(id) {
    const data = await makeIsaacApiCall('item', `&id=${id}`);
    return data;
}

module.exports = { getItemName, getItemID };