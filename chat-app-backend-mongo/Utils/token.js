const jwt = require("jsonwebtoken");

exports.sendAccessToken = async (id) => {
  return await jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};


