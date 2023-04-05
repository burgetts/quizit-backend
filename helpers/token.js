const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");

/** return signed JWT from user data. */

function createToken(user) {
  let payload = {
    username: user.username
  };
  console.log(payload, 'payload')
  const token = jwt.sign(payload, SECRET_KEY);
  console.log(token, 'token')
  return token
}

module.exports = { createToken };