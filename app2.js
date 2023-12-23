const express = require('express');
const path = require('path');
const fileUpload = require('express-fileupload');
const ejsmate = require('ejs-mate');
const bodyParser = require('body-parser');
const session = require('express-session');
const flash = require('connect-flash');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const nodemailer = require('nodemailer');

// Import database configuration
const db = require('./dbConfig');

// Import routes
const routes = require('./routes');

const app = express();

// Other configurations (fileUpload, cors, bodyParser, etc.)

// Create a transporter object
const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: 'prolancerwebsite@gmail.com',
        pass: 'yvzumfmaehebazwt'
    }
});
app.use(fileUpload({
    createParentPath: true
}));
app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }))
app.use(flash())
app.use(sessions(sessionConfig));
app.use((req, res, next) => {
    res.locals.current_user = req.session.__id;
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    next();
});

// EJS configuration
app.engine('ejs', ejsmate);
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration
const sessionConfig = {
    secret: "thisismysecrctekey",
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7,
    },
    resave: false};

app.use(session(sessionConfig));
app.use(cookieParser());
app.use(flash());

// Middleware for locals
app.use((req, res, next) => {
  // Your middleware for locals
  next();
});

// Use routes
app.use('/', routes);

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

//browse companies(buyer)
    app.get('/browse-companies', async (req, res) => {}
//opening the page which has all the orders of the products posted by a seller(seller module)
    app.get('/dashboard-manage-jobs', async (req, res) => {}
//view cart(buyer)
    app.get('/dashboard-my-active-bids', async (req, res) => {}
//remove an item from cart(buyer)
    app.get('/removecartitem/:cart_id/:product_id', async (req, res) => {}
//opens the page for all orders by a buyer
    app.get('/myactivejobs', async (req, res) => {}
//view any order details(buyer)
    app.get('/vieworderdetails/:order_id', async (req, res) => {}
//update a product page opens(seller)
    app.get('/updateproduct/:product_id', async (req, res) => {}
//page where seller posts a product
    app.get('/dashboard-post-a-task', async (req, res) => {} 
//buyer details page which opens just after registering
    app.get('/dashboard-settings', async (req, res) => {}   
//company details page where company can change details
    app.get('/detailscompany', async (req, res) => {}
//buyer details page(buyer module)
    app.get('/detailsfreelancer', async (req, res) => {}
//page which has all companies
    app.get('/sellers-grid-layout-full-page', async (req, res) => {}
//main homescreen for company account
    app.get('/index-company', async (req, res) => {}
//main homescreen when not logged in
    app.get('/index-logged-out', async (req, res) => {}
//main homescreen for buyer
    app.get('/index', async (req, res) => {}
//pages which can be shown whenever any error occurs
    app.get('/nomore', (req, res) => {}
//pages which can be shown whenever any error occurs
    app.get('/pages-404', (req, res) => {}
//page which has contact details if anyonw wants to contact us and option to fill a form
    app.get('/pages-contact', (req, res) => {}
//login page
    app.get('/pages-login', (r+--eq, res) => {}
//register page
    app.get('/pages-register', (req, res) => {} 
//page which has privacy policy of the website
    app.get('/privacy', (req, res) =>{}
//page where seller/company sets their detials(opens after registering)
    app.get('/setting-company', async (req, res) => {}
//page where we can see all the products posted and apply filters according to some available options
    app.get('/tasks-grid-layout-full-page', async (req, res) => {}
//terms of use page for the website
    app.get('/termsofuse', (req, res) => {}
//get request which logs out seller account    
    app.get('/logout/company', async (req, res) => {}
//get request which logs out buyer account    
    app.get('/logout/freelancer', async (req, res) => {}
//opens the page of a product which has all its features and a addtocart option(buyer account)
    app.get('/addcart/:product_id', async (req, res) => {}
//page where buyer can see all the sellers
    app.get('/browsecompanyfreelancer', async (req, res) => {}
//page where a seller can see all profile of another seller
    app.get('/single-company-profile/:seller_id'
//page where a seller can see their own profile
    app.get('/companyprofile', async (req, res) => {}
//page where a buyer can see all profile and products of a seller
    app.get("/singlecompanypagefreelancer/:seller_id", async (req, res) => {}
//page where buyer can see all the reviews they have given 
    app.get('/dashboard-reviews', async (req, res) => {}
//page where seller can see all the reviews they have been given on their products
    app.get('/companyreviews', async (req, res) => {}
//page where buyer can see their own profile with all details
    app.get('/single-freelancer-profile/', async (req, res) => {}
//page where seller can see all thier uploaded products and gives them option to edit product details
    app.get('/dashboard-manage-tasks', async (req, res) => {}
//get req which sets status of an order to received(buyer)
    app.get('/receive-order/:item_id', async (req, res) => {}
//get req which lets the seller accept the payment
    app.get('/acceptpayment/:item_id', async (req, res) => {}
//request which updates an order to (shipping)(seller does it)
    app.get('/processorder/:item_id', async (req, res) => {}
//request which handles deteleing a product by a seller
    app.get('/removetask/:id', async (req, res) => {}
//request which marks a product as delivereeed by the buyer
    app.get('/markasdelivered/:item_id', async (req, res) => {}


//post request to update the cart
    app.post('/updatecart', async (req, res) => {} 
//requesr which handles logic for confirming an order from cart by the buyer
    app.post('/confirmorder', async (req, res) => {}
//request which handles logic for updating a specific product details by the seller
    app.post('/updateproduct', async (req, res) => {}
//req which adds a prosuct by a seller
    app.post('/dashboard-post-a-task', async (req, res) => {}
//post request for updating buyer details
    app.post('/dashboard-settings', async (req, res) => {}
//post request which handles logic for applying filters on the sellers page according to the parameters given 
    app.post('/sellers-grid-layout-full-page',
//post request for updating seller details by the sellers
    app.post('/setting-company', async (req, res) => {}
//post request for updating the buyer details by the buyer
    app.post("/detailsfreelancer", async (req, res) => {}
//post request which handles logic for applying filters on the products search page according to the parameters given (buyer module)
    app.post('/tasks-grid-layout-full-page', async (req,res) => {} 
//post request for registering a new account by both seller and buyer
    app.post('/pages-register', async (req, res) => {}
//post request for updating the seller details in the database
    app.post('/detailscompany', async (req, res) => {}      
//post request which handles the details of login
    app.post('/pages-login', async (req, res) => {}
//post request handling adding products to cart
    app.post("/done", async (req, res) => {}
//post request which gives a review to a prodfuct(by a buyer)
    app.post('/giveproductreview', async (req, res) => {}
//post request wjhich operates when a user fills the contact us form of the website and sends an email to the website's email
    app.post("/contact", async (req, res) => {}




BUYER:
//browse companies(buyer)
app.get('/browse-companies', async (req, res) => {}
//view cart(buyer)
app.get('/dashboard-my-active-bids', async (req, res) => {}
//remove an item from cart(buyer)
app.get('/removecartitem/:cart_id/:product_id', async (req, res) => {}

//opens the page for all orders by a buyer
app.get('/myactivejobs', async (req, res) => {}
//view any order details(buyer)
app.get('/vieworderdetails/:order_id', async (req, res) => {}

//buyer details  page which opens just after registering
 app.get('/dashboard-settings', async (req, res) => {}
//buyer details page(buyer module)
app.get('/detailsfreelancer', async (req, res) => {}
//main homescreen for buyer
app.get('/index', async (req, res) => {}
//get request which logs out buyer account    
app.get('/logout/freelancer', async (req, res) => {}
//opens the page of a product which has all its features and a addtocart option(buyer account)
app.get('/addcart/:product_id', async (req, res) => {}
//page where buyer can see all the sellers
app.get('/browsecompanyfreelancer', async (req, res) => {}
//page where a buyer can see all profile and products of a seller
app.get("/singlecompanypagefreelancer/:seller_id", async (req, res) => {}
//page where buyer can see all the reviews they have given 
app.get('/dashboard-reviews', async (req, res) => {}
//page where buyer can see their own profile with all details
app.get('/single-freelancer-profile/', async (req, res) => {}

//get req which sets status of an order to received(buyer)
app.get('/receive-order/:item_id', async (req, res) => {}
//request which marks a product as delivereeed by the buyer
app.get('/markasdelivered/:item_id', async (req, res) => {}


//post request to update the cart
app.post('/updatecart', async (req, res) => {} 
//requesr which handles logic for confirming an order from cart by the buyer
    app.post('/confirmorder', async (req, res) => {}
//post request for updating buyer details
app.post('/dashboard-settings', async (req, res) => {}
//post request for updating the buyer details by the buyer
app.post("/detailsfreelancer", async (req, res) => {}
//post request which handles logic for applying filters on the products search page according to the parameters given (buyer module)
app.post('/tasks-grid-layout-full-page', async (req,res) => {} 
//post request handling adding products to cart
app.post("/done", async (req, res) => {}
//post request which gives a review to a prodfuct(by a buyer)
app.post('/giveproductreview', async (req, res) => {}

SELLER:

//opening the page which has all the orders of the products posted by a seller(seller module)
app.get('/dashboard-manage-jobs', async (req, res) => {}
//update a product page opens(seller)
app.get('/updateproduct/:product_id', async (req, res) => {}
//page where seller posts a product
    app.get('/dashboard-post-a-task', async (req, res) => {} 
//company details page where company can change details
app.get('/detailscompany', async (req, res) => {}
//page which has all companies
app.get('/sellers-grid-layout-full-page', async (req, res) => {}
//main homescreen for company account
app.get('/index-company', async (req, res) => {}
//page where seller/company sets their detials(opens after registering)
app.get('/setting-company', async (req, res) => {}
//page where we can see all the products posted and apply filters according to some available options
app.get('/tasks-grid-layout-full-page', async (req, res) => {}
//get request which logs out seller account    
app.get('/logout/company', async (req, res) => {}

//page where a seller can see all profile of another seller
app.get('/single-company-profile/:seller_id'
//page where a seller can see their own profile
    app.get('/companyprofile', async (req, res) => {}
//page where seller can see all the reviews they have been given on their products
app.get('/companyreviews', async (req, res) => {}
//page where seller can see all thier uploaded products and gives them option to edit product details
app.get('/dashboard-manage-tasks', async (req, res) => {}
//get req which lets the seller accept the payment
app.get('/acceptpayment/:item_id', async (req, res) => {}
//request which updates an order to (shipping)(seller does it)
    app.get('/processorder/:item_id', async (req, res) => {}
//request which handles deteleing a product by a seller
    app.get('/removetask/:id', async (req, res) => {}


//request which handles logic for updating a specific product details by the seller
app.post('/updateproduct', async (req, res) => {}
//req which adds a prosuct by a seller
app.post('/dashboard-post-a-task', async (req, res) => {}
//post request which handles logic for applying filters on the sellers page according to the parameters given 
app.post('/sellers-grid-layout-full-page',
//post request for updating seller details by the sellers
    app.post('/setting-company', async (req, res) => {}
//post request for updating the seller details in the database
app.post('/detailscompany', async (req, res) => {}   


auth:

//page which has all companies
    app.get('/sellers-grid-layout-full-page', async (req, res) => {}
//main homescreen when not logged in
app.get('/index-logged-out', async (req, res) => {}
//pages which can be shown whenever any error occurs
app.get('/nomore', (req, res) => {}
//pages which can be shown whenever any error occurs
    app.get('/pages-404', (req, res) => {}
//page which has contact details if anyonw wants to contact us and option to fill a form
    app.get('/pages-contact', (req, res) => {}
//login page
    app.get('/pages-login', (r+--eq, res) => {}
//register page
    app.get('/pages-register', (req, res) => {} 
//page which has privacy policy of the website
    app.get('/privacy', (req, res) =>{}
//terms of use page for the website
app.get('/termsofuse', (req, res) => {}
//post request for registering a new account by both seller and buyer
app.post('/pages-register', async (req, res) => {}
//post request which handles the details of login
app.post('/pages-login', async (req, res) => {}
//post request wjhich operates when a user fills the contact us form of the website and sends an email to the website's email
app.post("/contact", async (req, res) => {}
//get request which logs out seller account    
app.get('/logout/company', async (req, res) => {}
//get request which logs out buyer account    
    app.get('/logout/freelancer', async (req, res) => {}