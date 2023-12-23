const mysql = require('mysql2/promise');

let connection;
// let connection;
// const connect = async function example() {
//     connection = await mysql.createConnection({
//         host: 'localhost',
//         user: 'root',
//         password: '1234',
//         database: 'ecommerce',
//         insecureAuth: true
//     });
// };
// connect();
const connect = async function example() {
    try {
        if (!connection) {
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '1234',
            database: 'ecommerce',
            insecureAuth: true
        });
        console.log('Connected to database'); // Optionally log a success message
    }
        // console.log(connection); // Optionally log a success message

        return connection; // Return the connection after it's established
    } catch (error) {
        console.error('Error connecting to database:', error);
        throw error; // Throw an error if connection fails
    }
};

// Export an async function that connects and returns the connection when called
module.exports =  connect;
