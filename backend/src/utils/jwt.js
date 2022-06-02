const jwt = require("jsonwebtoken");
require("dotenv").config();

const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;

module.exports = {
  signAccessToken(payload) {
    return new Promise((resolve) => {
      jwt.sign({ payload }, accessTokenSecret, {}, (err, token) => {
        if (err) {
          console.error(err);
        }
        resolve(token);
      });
    });
  },

  verifyAccessToken(token) {
    return new Promise((resolve, reject) => {
      jwt.verify(token, accessTokenSecret, (err, payload) => {
        if (err) {
          const message =
            err.name === "JsonWebTokenError" ? "Unauthorized" : err.message;
          reject(message);
        }
        resolve(payload);
      });
    });
  },
};
