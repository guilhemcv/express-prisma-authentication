/* eslint-disable consistent-return */
const jwt = require("../utils/jwt");

const auth = async (req, res, next) => {
  if (!req.headers.cookie) {
    return res.status(401).json({
      status: 401,
      error: "You are not authorized to access this resource",
    });
  }
  const token = req.headers.cookie.split("=")[1];
  if (!token) {
    return res.status(401).json({
      status: 401,
      error: "You are not authorized to access this resource",
    });
  }
  await jwt
    .verifyAccessToken(token)
    .then((user) => {
      console.warn("no user", user);
      req.user = user;
      next();
    })
    .catch((e) => {
      console.error(e);
      return res.status(401).json({
        status: 401,
        error: "You are not authorized to access this resource",
      });
    });
};
module.exports = auth;
