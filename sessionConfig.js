const sessions = require('express-session');

const sessionConfig = {
    secret: "thisismysecrctekey",
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 63072000000,
        maxAge: 63072000000,
    },
    resave: false
};
module.exports = sessionConfig;