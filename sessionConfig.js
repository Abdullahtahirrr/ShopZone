const sessions = require('express-session');

const sessionConfig = {
    secret: "thisismysecrctekey",
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7,
    },
    resave: false
};
module.exports=sessionConfig;