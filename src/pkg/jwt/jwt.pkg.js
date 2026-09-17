const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();

const accessToken = process.env.ACCESS_TOKEN || process.env.REGISTER_TOKEN;

const verifyLoginToken = (token) => {
  return jwt.verify(token, accessToken);
};

module.exports = {
  verifyLoginToken,
};
