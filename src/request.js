const axios = require("axios");

module.exports = function request(url) {
  return axios.get(url).then((res) => {
    return res.data;
  });
};
