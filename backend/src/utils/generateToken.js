const jwt = require('jsonwebtoken');
const config = require('../config/config');

const generateAccessToken = (id) => {
  return jwt.sign({ id, type: 'access' }, config.jwtSecret, {
    expiresIn: '30m',
  });
};

const generateRefreshToken = (id) => {
  return jwt.sign({ id, type: 'refresh' }, config.jwtSecret, {
    expiresIn: '30d',
  });
};

const generateTokenPair = (id) => ({
  accessToken: generateAccessToken(id),
  refreshToken: generateRefreshToken(id),
  accessTokenExpires: Date.now() + 30 * 60 * 1000,
  refreshTokenExpires: Date.now() + 30 * 24 * 60 * 60 * 1000,
});

const generateToken = (id) => {
  return jwt.sign({ id }, config.jwtSecret, {
    expiresIn: '30m',
  });
};

const refreshAccessToken = (refreshToken) => {
  const decoded = jwt.verify(refreshToken, config.jwtSecret);
  if (decoded.type !== 'refresh') throw new Error('Invalid token type');
  return {
    accessToken: generateAccessToken(decoded.id),
    accessTokenExpires: Date.now() + 30 * 60 * 1000,
  };
};

module.exports = {
  generateToken,
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  refreshAccessToken,
};
