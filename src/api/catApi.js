const axios = require('axios');

const fetchCatPicture = async (apiKey) => {
    const response = await axios.get(`https://api.thecatapi.com/v1/images/search?api_key=${apiKey}`);
    return response.data[0].url;
};

module.exports = { fetchCatPicture };