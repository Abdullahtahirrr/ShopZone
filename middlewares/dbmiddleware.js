// databaseMiddleware.js
const getDatabaseConnection = require('../dbConfig');

async function databaseMiddleware(req, res, next) {
  try {
    const connection = await getDatabaseConnection();
    req.db = connection; // Attach the database connection to the request object
    next();
  } catch (error) {
    console.error('Error establishing database connection:', error);
    res.status(500).send('Internal Server Error');
  }
}

module.exports = databaseMiddleware;
