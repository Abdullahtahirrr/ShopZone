const express = require('express');
const cookieParser = require('cookie-parser');
const sessions = require('express-session');
const bodyParser = require('body-parser');
const ejsmate = require('ejs-mate');
const path = require('path');
const flash = require('connect-flash');
const fileUpload = require('express-fileupload');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const buyerRoutes = require('./routes/buyerRoutes');
const sellerRoutes = require('./routes/sellerRoutes');

const databaseMiddleware = require('./middlewares/dbmiddleware');
const errorHandlerMiddleware = require('./middlewares/errorHandlerMiddleware');

// Import nodemailer transporter setup
const transporter = require('./transporterConfig');
const sessionConfig = require('./sessionConfig');


const app = express();

app.use(fileUpload({
    createParentPath: true
}));
app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.engine("ejs", ejsmate);
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }))
app.use(flash())
app.use(sessions(sessionConfig));

// Set up transporter in your app
app.set('transporter', transporter);
app.use((req, res, next) => {
    req.transporter = transporter; // Attach transporter to the req object
    req.path = path;
    next();
});
app.use(databaseMiddleware);
app.use('/', authRoutes);
app.use('/', buyerRoutes);
app.use('/', sellerRoutes);

app.use(errorHandlerMiddleware);


app.listen(3000, () => {
    console.log('Server listening on port 3000');
});
