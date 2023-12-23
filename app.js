const express = require('express');
const cookieParser = require("cookie-parser");
const sessions = require('express-session');
const bodyParser = require('body-parser');
// const mysql = require('mysql2/promise');
const ejsmate = require("ejs-mate")
const path = require("path");
const flash = require("connect-flash")
const fileUpload = require("express-fileupload")
const cors = require("cors")
const bcrypt = require('bcrypt');

const indexLoggedOutRoutes = require('./routes/index');
const databaseMiddleware = require('./middlewares/dbmiddleware');
const errorHandlerMiddleware = require('./middlewares/errorHandlerMiddleware');




const nodemailer = require('nodemailer');

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



const app = express();
app.use(databaseMiddleware);
app.use('/', indexLoggedOutRoutes);


app.use(fileUpload({
    createParentPath: true
}));
app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.engine("ejs", ejsmate);
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, 'public')));

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


app.get('/browse-companies', async (req, res) => {
    const [companies] = await connection.execute(`SELECT * FROM seller_profile`)
    let [details] = await connection.execute(`SELECT * FROM buyer_profile WHERE buyer_id=(Select buyer_id from buyer_accounts where status=1)`)
    if (!details[0]) {
        console.log("HERE");
        [details] = await connection.execute(`SELECT * FROM seller_accounts WHERE seller_id=(Select seller_id from seller_accounts where status=1)`)
    }
    res.render('browse-companies.ejs', { companies: companies, details: details })
})

app.get('/dashboard-manage-jobs', async (req, res) => {
    const [details] = await connection.execute(`SELECT * FROM seller_profile WHERE seller_id=(Select seller_id from seller_accounts where status=1)`)

    const [rows] = await connection.execute( `SELECT * FROM orders 
    JOIN order_items ON orders.order_id = order_items.order_id 
    JOIN products ON order_items.product_id = products.product_id
    WHERE products.seller_id="${details[0].seller_id}"
    ORDER BY orders.order_id DESC`)
    res.render('dashboard-manage-jobs.ejs', { orders: rows,calculateDuration: calculateDuration,details: details });
  
});

app.get('/dashboard-my-active-bids', async (req, res) => {
    const [details] = await connection.execute(`SELECT * FROM buyer_profile WHERE buyer_id=(Select buyer_id from buyer_accounts where status=1)`);
    const query = `
    SELECT ci.cart_id, ci.product_id, ci.quantity,
           p.product_name, p.price,
           pq.quantity as max_quantity
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.product_id
    JOIN product_quantity pq ON p.product_id = pq.product_id
    JOIN cart_details cd ON ci.cart_id = cd.cart_id
    WHERE cd.buyer_id = ? AND cd.cart_status = 1;
  `;

  // Execute the query with the buyer ID as a parameter
    const [cartItems] = await connection.execute(query, [details[0].buyer_id]);
    res.render('dashboard-my-active-bids.ejs', { details: details,cartItems:cartItems })
})

app.get('/removecartitem/:cart_id/:product_id', async (req, res) => {
    const product_Id = req.params.product_id;
    const cart_Id = req.params.cart_id

    try {
        // Perform the query to delete the product from the cart_items table
        const [quan]= await connection.execute(`SELECT SUM(quantity) AS qua FROM cart_items WHERE product_id = "${product_Id}" and cart_id="${cart_Id}" GROUP BY product_id`);
        await connection.execute(`DELETE FROM cart_items WHERE product_id = "${product_Id}" and cart_id="${cart_Id}"`);
        await connection.execute(`UPDATE product_quantity SET quantity=quantity+"${quan[0].qua}" WHERE product_id = "${product_Id}"`);
        // Redirect back to the cart page
        res.redirect('/dashboard-my-active-bids');
    } catch (error) {
        console.error(error);
        res.send('Error occurred while removing item from cart.');
    }
});

app.post('/updatecart', async (req, res) => {
    let cartItems = [];
    
    // Extract cart items from the req.body object
    for (let i = 0; req.body[`cartItems[${i}][cart_id]`]; i++) {
      const cart_id = req.body[`cartItems[${i}][cart_id]`];
      const product_id = req.body[`cartItems[${i}][product_id]`];
      const quantity = req.body[`cartItems[${i}][quantity]`];
      
      cartItems.push({ cart_id, product_id, quantity });
    }
  
    try {
        // Get the old quantities for each cart item
        const oldQuantities = {};
        for (const item of cartItems) {
            const [row] = await connection.execute(`SELECT quantity FROM cart_items WHERE cart_id = "${item.cart_id}" AND product_id = "${item.product_id}"`);
            oldQuantities[item.cart_id + '_' + item.product_id] = row.length ? row[0].quantity : 0;
        }

        // Perform the update queries to update the quantity of each item in the cart and update product_quantity table
        for (const item of cartItems) {
            console.log(item)
            const cartItemId = item.cart_id + '_' + item.product_id;
            const newQuantity = parseInt(item.quantity);
            const oldQuantity = oldQuantities[cartItemId];
            const quantityDifference = newQuantity - oldQuantity;

            // Update cart_items table with new quantity
            await connection.execute(`UPDATE cart_items SET quantity = "${newQuantity}" WHERE cart_id = "${item.cart_id}" AND product_id = "${item.product_id}"`);
            console.log(quantityDifference)

            // Update product_quantity table with the quantity difference
            await connection.execute(`UPDATE product_quantity SET quantity = quantity - "${quantityDifference}" WHERE product_id = "${item.product_id}"`);
        }

        // Redirect back to the cart page
        res.redirect('/dashboard-my-active-bids');
    } catch (error) {
        console.error(error);
        res.send('Error occurred while updating cart.');
    }
});

app.post('/confirmorder', async (req, res) => {
    let cartItems = [];
    
    // Extract cart items from the req.body object
    for (let i = 0; req.body[`cartItems[${i}][cart_id]`]; i++) {
      const cart_id = req.body[`cartItems[${i}][cart_id]`];
      const product_id = req.body[`cartItems[${i}][product_id]`];
      const quantity = req.body[`cartItems[${i}][quantity]`];
      
      cartItems.push({ cart_id, product_id, quantity });
    }
    const payment=req.body.paymentOption;
  
    try {
        
    const [details] = await connection.execute(`SELECT * FROM buyer_profile WHERE buyer_id=(Select buyer_id from buyer_accounts where status=1)`);

        // Get the old quantities for each cart item
        const oldQuantities = {};
        for (const item of cartItems) {
            const [row] = await connection.execute(`SELECT quantity FROM cart_items WHERE cart_id = "${item.cart_id}" AND product_id = "${item.product_id}"`);
            oldQuantities[item.cart_id + '_' + item.product_id] = row.length ? row[0].quantity : 0;
        }

        // Perform the update queries to update the quantity of each item in the cart and update product_quantity table
        for (const item of cartItems) {
            console.log(item)
            const cartItemId = item.cart_id + '_' + item.product_id;
            const newQuantity = parseInt(item.quantity);
            const oldQuantity = oldQuantities[cartItemId];
            const quantityDifference = newQuantity - oldQuantity;

            // Update cart_items table with new quantity
            await connection.execute(`UPDATE cart_items SET quantity = "${newQuantity}" WHERE cart_id = "${item.cart_id}" AND product_id = "${item.product_id}"`);
            console.log(quantityDifference)

            // Update product_quantity table with the quantity difference
            await connection.execute(`UPDATE product_quantity SET quantity = quantity - "${quantityDifference}" WHERE product_id = "${item.product_id}"`);
        }

        const [cartItems2] = await connection.execute(
            'SELECT p.seller_id,ci.cart_id, ci.product_id, ci.quantity, p.price FROM cart_items ci JOIN products p ON ci.product_id = p.product_id WHERE ci.cart_id IN (SELECT cart_id FROM cart_details WHERE buyer_id = ? AND cart_status = 1)',
            [details[0].buyer_id]
        );

        // Calculate the order total
        let orderTotal = 0;
        for (const item of cartItems2) {
            orderTotal += item.price * item.quantity;
        }

        // Create a new order entry in the "orders" table
        const orderDate = new Date();
        const orderStatus = "Pending"; // Assuming 1 means "Confirmed" and 0 means "Pending" or "Cancelled"
        const [orderResult] = await connection.execute(
            'INSERT INTO orders (buyer_id, order_date, total, payment_choice) VALUES ( ?, ?, ?,?)',
            [details[0].buyer_id, orderDate, orderTotal, payment]
        );

        const orderId = orderResult.insertId;

        // Create entries in the "order_items" table for each item in the cart
        for (const item of cartItems2) {
            const sellerId = item.seller_id;
            const quantity = item.quantity;
            const sumPrice = item.price * item.quantity;

            await connection.execute(
                'INSERT INTO order_items (order_id, product_id, seller_id, quantity,order_status, sumPrice) VALUES (?,?, ?, ?, ?, ?)',
                [orderId, item.product_id, sellerId, quantity,orderStatus, sumPrice]
            );
        }

        // Update the cart status to 0 to indicate it has been used for the order
        await connection.execute('UPDATE cart_details SET cart_status = 0 WHERE buyer_id = ?', [details[0].buyer_id]);
    

        res.redirect('/index'); // Change this URL as per your requirement
    } catch (error) {
        console.error(error);
        res.send('Error occurred while confirming the order.');
    }
});




app.get('/myactivejobs', async (req, res) => {
    // const [row1] = await connection.execute(`SELECT * FROM job_applied join jobs on job_applied.job_id=jobs.job_id WHERE freelance_id=(Select id from register_freelancer where status=1 )`);
    const [details] = await connection.execute(`SELECT * FROM buyer_profile WHERE buyer_id=(Select buyer_id from buyer_accounts where status=1)`);
    const [orders] = await connection.execute(`SELECT
                                    o.order_id,
                                    SUM(oi.quantity) AS total_products,
                                    SUM(oi.sumPrice) AS total,
                                    oi.order_status,o.payment_choice
                                    FROM orders o
                                    JOIN order_items oi ON o.order_id = oi.order_id
                                    WHERE buyer_id = "${details[0].buyer_id}"
                                    GROUP BY o.order_id, oi.order_status`)
   
    res.render('myactivejobs.ejs', { orders:orders, details: details })
    // res.sendFile(path.join(__dirname + '/views//dashboard-my-active-bids.html'));
})
app.get('/vieworderdetails/:order_id', async (req, res) => {
    const order_id=req.params.order_id;
    const [details] = await connection.execute(`SELECT * FROM buyer_profile WHERE buyer_id=(Select buyer_id from buyer_accounts where status=1)`);
    const query = `
    SELECT oi.order_id,oi.order_status, oi.product_id, oi.quantity,
       p.product_name, p.price, oi.item_id,
       o.payment_choice
    FROM order_items oi
    JOIN orders o USING(order_id)
    JOIN products p ON oi.product_id = p.product_id
    
    WHERE oi.order_id = ?;
  `;

  // Execute the query with the buyer ID as a parameter
    const [cartItems] = await connection.execute(query, [order_id]);
    res.render('vieworderdetails.ejs', { details,cartItems })
});

app.get('/updateproduct/:product_id', async (req, res) => {
    const product_id = req.params.product_id;
    try {
      const [rows] = await connection.execute(`
        SELECT products.product_id,products.description, products.price, product_quantity.quantity, 
               product_categories.category_name, products.product_name, products.image
        FROM products
        JOIN product_quantity ON products.product_id = product_quantity.product_id
        JOIN product_categories ON products.category_id = product_categories.category_id
        WHERE products.product_id = ?
      `, [product_id]);
  
      if (rows.length > 0) {
        const info1 = rows[0];
        const [details] = await connection.execute(`SELECT * FROM seller_profile WHERE seller_id=(SELECT seller_id FROM seller_accounts WHERE status=1)`);
        console.log(info1);
        res.render('updateproduct.ejs', { details: details, info1: info1 });
      } else {
        console.log(`No product found with product_id ${product_id}`);
        res.status(404).send('Product not found.');
      }
    } catch (error) {
      console.error('Error:', error);
      res.status(500).send('Internal server error.');
    }
  });
app.post('/updateproduct', async (req, res) => {
    console.log("heree")
    const pass = req.body.productname
    const pass2 = req.body.category
    const pass3 = req.body.quantity
    const pass4 = req.body.min
    const pass7 = req.body.ptext
    const pass9 = req.body.skill
    const values = pass9.split(',')
    const id=req.body.productid;
    let picpath = ""
    try {
        const samplepic = req.files.picture
        const uploadpathpic = __dirname + "/public/uploads/" + samplepic.name
        picpath = "/uploads/" + samplepic.name
        samplepic.mv(uploadpathpic, function (err) {
            if (err) return res.status(500).send(err)
            // else console.log("UPLOADEDDDDDDD")
        })

    }
    catch (TypeError) {
        {
            picpath = req.body.defaultfile
        }
    }
    const [company_id] = await connection.execute('SELECT * from seller_accounts where status=1');

    // Check if the category already exists in the categories table
    const [existingCategory] = await connection.execute('SELECT category_id FROM product_categories WHERE category_name = ?', [pass2]);

    let categoryId;
    if (existingCategory.length === 0) {
        // If the category doesn't exist, insert it into the categories table
        const query4 = 'INSERT INTO product_categories (category_name) VALUES (?)';
        const [result] = await connection.execute(query4, [pass2]);

        const [category] = await connection.execute('SELECT category_id FROM product_categories WHERE category_name = ?', [pass2]);
        categoryId=category[0].category_id;
    } else {
        // If the category already exists, retrieve the existing category_id
        categoryId = existingCategory[0].category_id;
    }

    const query = `UPDATE products SET category_id="${categoryId}",seller_id="${company_id[0].seller_id}", product_name="${pass}", price="${pass4}", description="${pass7}", image="${picpath}" WHERE product_id=${id}`;
    await connection.execute(query);
    await connection.execute(`UPDATE product_quantity SET quantity="${pass3}" WHERE product_id=${id}`)
    await connection.execute(`UPDATE product_posted_time SET time_posted=NOW() WHERE product_id=${id}`)

    for (let i = 0; i < values.length; i++) {
        const tagName = values[i];
    
        const [existingTag] = await connection.execute('SELECT tag_id FROM tags WHERE tag_name = ?', [tagName]);
    
        if (existingTag.length === 0) {
            // If the tag doesn't exist, insert it into the tags table
            const query2 = 'INSERT INTO tags (tag_name) VALUES (?)';
            await connection.execute(query2, [tagName]);
    
            const [newTag] = await connection.execute('SELECT tag_id FROM tags WHERE tag_name = ?', [tagName]);
            const query3 = 'INSERT INTO product_tags (product_id, tag_id) VALUES (?, ?)';
            await connection.execute(query3, [id, newTag[0].tag_id]);
        } else {
            // If the tag already exists, check if the product_id and tag_id combination already exists in the product_tags table
            const tagId = existingTag[0].tag_id;
            const [existingProductTag] = await connection.execute(
                'SELECT * FROM product_tags WHERE product_id = ? AND tag_id = ?',
                [id, tagId]
            );
    
            if (existingProductTag.length === 0) {
                // If the product_id and tag_id combination doesn't exist in the product_tags table, insert the new entry
                const query3 = 'INSERT INTO product_tags (product_id, tag_id) VALUES (?, ?)';
                await connection.execute(query3, [id, tagId]);
            } else {
                // If the product_id and tag_id combination already exists, skip inserting and move to the next tag
                console.log(`Product with ID ${id} and Tag ID ${tagId} already exists in product_tags table.`);
            }
        }
    }
    
    // await connection.execute(`INSERT INTO time_posted_duration_tasks (id) VALUES (?)`, [task[0].proj_id]);
    res.redirect("/index-company");
});
  
app.get('/dashboard-post-a-task', async (req, res) => {
    const [details] = await connection.execute(`SELECT * FROM seller_profile WHERE seller_id=(Select seller_id from seller_accounts where status=1)`)

    res.render('dashboard-post-a-task.ejs', { details })
});
app.post('/dashboard-post-a-task', async (req, res) => {
    const pass = req.body.projectname
    const pass2 = req.body.category
    const pass3 = req.body.quantity
    const pass4 = req.body.min
    const pass7 = req.body.ptext
    const pass8 = req.files.picture
    const pass9 = req.body.skill
    const values = pass9.split(',')

    const uploadpathfile = __dirname + "/public/docs/" + pass8.name
    const filepath = "/docs/" + pass8.name
    pass8.mv(uploadpathfile, function (err) {
        if (err) return res.status(500).send(err)
    })

    const [company_id] = await connection.execute('SELECT * from seller_accounts where status=1');


    // Check if the category already exists in the categories table
    const [existingCategory] = await connection.execute('SELECT category_id FROM product_categories WHERE category_name = ?', [pass2]);

    let categoryId;

    if (existingCategory.length === 0) {
        // If the category doesn't exist, insert it into the categories table
        const query4 = 'INSERT INTO product_categories (category_name) VALUES (?)';
        const [result] = await connection.execute(query4, [pass2]);

        const [category] = await connection.execute('SELECT category_id FROM product_categories WHERE category_name = ?', [pass2]);
        categoryId=category[0].category_id;
    } else {
        // If the category already exists, retrieve the existing category_id
        categoryId = existingCategory[0].category_id;
    }


    const query = `INSERT INTO products (category_id,seller_id, product_name, price, description, image) VALUES (?,?, ?, ?, ?,?)`;
    await connection.execute(query, [categoryId,company_id[0].seller_id, pass, pass4, pass7, filepath]);

    const [task] = await connection.execute('SELECT * from products order by product_id Desc limit 1 ');
    //quantity
    const query1 = `INSERT INTO product_quantity (product_id,quantity) VALUES (?,?)`;
    await connection.execute(query1, [task[0].product_id,pass3]);
    //time
    const query2 = `INSERT INTO product_posted_time (product_id,time_posted) VALUES (?,NOW())`;
    await connection.execute(query2, [task[0].product_id]);

    for (let i = 0; i < values.length; i++) {
        const tagName = values[i];

        const [existingTag] = await connection.execute('SELECT tag_id FROM tags WHERE tag_name = ?', [tagName]);

        if (existingTag.length === 0) {
            // If the tag doesn't exist, insert it into the tags table
            const query2 = 'INSERT INTO tags (tag_name) VALUES (?)';
            await connection.execute(query2, [tagName]);

            const [newTag] = await connection.execute('SELECT tag_id FROM tags WHERE tag_name = ?', [tagName]);
            const query3 = 'INSERT INTO product_tags (product_id, tag_id) VALUES (?, ?)';
            await connection.execute(query3, [task[0].product_id, newTag[0].tag_id]);
        } else {
            // If the tag already exists, retrieve the existing tag_id and insert into the product_skills table
            const tagId = existingTag[0].tag_id;
            const query3 = 'INSERT INTO product_tags (product_id, tag_id) VALUES (?, ?)';
            await connection.execute(query3, [task[0].product_id, tagId]);
        }
    }

    res.redirect("/index-company");
});


app.get('/dashboard-settings', async (req, res) => {

    if (!connection) {
        res.send('Error: Database connection is not established');
        return;
    }
    try {
        const [id] = await connection.execute(`SELECT buyer_id FROM buyer_accounts WHERE status=1`)

        const [rows] = await connection.execute(`SELECT * FROM buyer_profile 
        JOIN addresses USING(buyer_id)
        JOIN countries USING(country_id)
        JOIN cities USING(city_id)
        WHERE buyer_id="${id[0].buyer_id}"`);
        const [details] = await connection.execute(`SELECT * FROM buyer_profile WHERE buyer_id=(Select buyer_id from buyer_accounts where status=1)`)

        let info = rows[0]
        const message = req.flash("mess")

        res.render('dashboard-settings.ejs', { info: info, message: message, details: details })
    } catch (error) {
        console.error(error);
        res.send(error);
    }
});

app.post('/dashboard-settings', async (req, res) => {
    const fname = req.body.fname;
    const lname = req.body.lname;
    const email = req.body.email;

    const tagline = req.body.city;
    const country = req.body.country;
    const describe = req.body.street_address;

    let picpath = ""
    try {
        const samplepic = req.files.picture

        const uploadpathpic = __dirname + "/public/uploads/" + samplepic.name
        picpath = "/uploads/" + samplepic.name
        samplepic.mv(uploadpathpic, function (err) {
            if (err) return res.status(500).send(err)
        })

    }
    catch (TypeError) {
        {
            picpath = req.body.defaultfile
        }
    }

    const query5 = `select * from buyer_accounts where status = 1`
    const [id] = await connection.execute(query5);
    if (req.body.cpass && req.body.npass && req.body.rpass) {
        // Compare hashed passwords
        const isPasswordMatch = await bcrypt.compare(req.body.cpass, id[0].password);
    
        if (isPasswordMatch && req.body.npass === req.body.rpass) {
            // Hash the new password
            const hashedPassword = await bcrypt.hash(req.body.npass, 12);
    
            // Update the hashed password in the database
            await connection.execute(
                `UPDATE buyer_accounts SET password="${hashedPassword}" WHERE buyer_id="${id[0].buyer_id}"`
            );
        } else {
            req.flash("mess", "Current Password Entered is not correct");
            return res.redirect("/dashboard-settings");
        }
    } else if (req.body.cpass || req.body.npass || req.body.rpass) {
        req.flash("mess", "Enter all password fields");
        return res.redirect("/dashboard-settings");
    }
    


    const query = `UPDATE buyer_profile SET  f_name="${fname}",l_name="${lname}",email="${email}",image="${picpath}" WHERE buyer_id=${id[0].buyer_id}`;
    await connection.execute(query)


    // Check and insert the country into the countries table
    let countryId;
    const [existingCountry] = await connection.execute('SELECT country_id FROM countries WHERE country_name = ?', [country]);
    if (existingCountry.length === 0) {
        const [countryResult] = await connection.execute('INSERT INTO countries (country_name) VALUES (?)', [country]);
        countryId = countryResult.insertId;
    } else {
        countryId = existingCountry[0].country_id;
    }

    // Check and insert the city into the cities table
    let cityId;
    const [existingCity] = await connection.execute('SELECT city_id FROM cities WHERE city_name = ?', [tagline]);
    if (existingCity.length === 0) {
        const [cityResult] = await connection.execute('INSERT INTO cities (city_name) VALUES (?)', [tagline]);
        cityId = cityResult.insertId;
    } else {
        cityId = existingCity[0].city_id;
    }
    console.log(cityId)
    // Check and insert the address into the addresses table
    let addressId;
    const [addressResult] = await connection.execute(`UPDATE addresses SET city_id="${cityId}", country_id="${countryId}", street_address="${describe}" WHERE buyer_id="${id[0].buyer_id}"`);
    addressId = addressResult.insertId;
   
    res.redirect("/index")
});



app.get('/detailscompany', async (req, res) => {
    let [details] = await connection.execute(`SELECT * FROM seller_profile WHERE seller_id=(Select seller_id from seller_accounts where status=1)`)

    const [id] = await connection.execute(`SELECT * FROM seller_accounts WHERE status=1`)
    res.render('detailscompany.ejs', { emailaddress: id[0].email, details: details })
});
app.get('/detailsfreelancer', async (req, res) => {
    let [details] = await connection.execute(`SELECT * FROM buyer_profile WHERE buyer_id=(Select buyer_id from buyer_accounts where status=1)`)
    const [id] = await connection.execute(`SELECT * FROM buyer_accounts WHERE status=1`)

    res.render('detailsfreelancer.ejs', { emailaddress: id[0].email, details: details })
});

app.get('/sellers-grid-layout-full-page', async (req, res) => {

    let [details] = await connection.execute(`SELECT * FROM seller_profile WHERE seller_id=(Select seller_id from seller_accounts where status=1)`)
    if (!details[0]) {
        console.log("HEREE");
        const [buyerDetails] = await connection.execute(`
        SELECT * FROM buyer_profile WHERE buyer_id = (SELECT buyer_id FROM buyer_accounts WHERE status = 1)
      `);
      
      details = buyerDetails.length > 0 ? buyerDetails : [];    }
    const [freelancers] = await connection.execute(`SELECT * FROM seller_profile`)
    res.render('sellers-grid-layout-full-page.ejs', { freelancers: freelancers, details: details })
})
app.post('/sellers-grid-layout-full-page', async (req, res) => {
    // Retrieve the form data from the request body
    const location = req.body.location;
    const keywords = req.body.keywords;
    const category = req.body.category;
    // const skills = req.body.skills
    const keywordsarray = keywords.split(',')
    // const skillsarray = skills.split(',')
    console.log(category)
    // Construct the SQL query using the form data
    let sql = 'SELECT  f.* FROM seller_profile f WHERE 1=1';
    if (location) {
        sql += ` AND headquarter LIKE '%${location}%'`;
    }
    if (keywords) {
        for (let i = 0; i < keywordsarray.length; i++) {

            sql += ` AND (companytype LIKE '%${keywords[i]}%'`;
            sql += ` OR intro LIKE '%${keywords[i]}%')`;
        }
    }
    if (category) {
        sql += ` AND companytype LIKE '%${category}%'`;
    }


    let [details] = await connection.execute(`SELECT * FROM seller_profile WHERE seller_id=(Select seller_id from seller_accounts where status=1)`)
    console.log(details)
    if (!details[0]) {
        console.log("Here")
        const [buyerDetails] = await connection.execute(`
        SELECT * FROM buyer_profile WHERE buyer_id = (SELECT buyer_id FROM buyer_accounts WHERE status = 1)
      `);
      
      details = buyerDetails.length > 0 ? buyerDetails : [];    }

    // Execute the SQL query
    const [freelancers] = await connection.execute(sql)
    // Render the template with the filtered jobs
    res.render('sellers-grid-layout-full-page.ejs', { freelancers: freelancers, details: details });

});

app.get('/index-company', async (req, res) => {
    const [id] = await connection.execute(`SELECT seller_id FROM seller_accounts WHERE status=1`)
    const query = `SELECT * FROM seller_profile WHERE seller_id="${id[0].seller_id}"`;
    const [details] = await connection.execute(query);
    const query1 = 'SELECT * FROM seller_profile LIMIT 5';
    const query3 = "SELECT count(*) as count from product_categories";
    const query4 = "SELECT count(*) as count from products JOIN product_quantity USING(product_id)";
    const query5 = "SELECT count(*) as count from buyer_accounts";
    const query6 = "SELECT count(*) as count from seller_accounts";

    const [freelancer] = await connection.execute(query1);
    console.log(freelancer)
    const [noofjobs] = await connection.execute(query4);
    console.log(noofjobs)
    const [nooffls] = await connection.execute(query5);
    console.log(nooffls)
    const [nooftasks] = await connection.execute(query3);
    console.log(nooftasks)
    const [noofcs] = await connection.execute(query6);
    console.log(noofcs)
    // insert user into the database
    res.render('index-company.ejs', { details: details, freelancer: freelancer, noofjobs: noofjobs, nooffls: nooffls, nooftasks: nooftasks, noofcs: noofcs })
})



app.get('/index-logged-out', async (req, res) => {
    const query1 = 'SELECT * FROM seller_profile LIMIT 5';
    const query2 = `SELECT p.*,sp.headquarter
    FROM products p
    JOIN seller_profile sp ON sp.seller_id = p.seller_id LIMIT 5`;
    const query3 = "SELECT count(*) as count from product_categories";
    const query4 = "SELECT count(*) as count from products JOIN product_quantity USING(product_id)";
    const query5 = "SELECT count(*) as count from buyer_accounts";
    const query6 = "SELECT count(*) as count from seller_accounts";
    const [freelancer] = await connection.execute(query1);
    const [jobs] = await connection.execute(query2);
    const [noofjobs] = await connection.execute(query4);
    const [nooffls] = await connection.execute(query5);
    const [nooftasks] = await connection.execute(query3);
    const [noofcs] = await connection.execute(query6);


    res.render('index-logged-out.ejs', { freelancer: freelancer, jobs: jobs, noofjobs: noofjobs, nooffls: nooffls, nooftasks: nooftasks, noofcs: noofcs })
})

// app.get('/index', async (req, res) => {
//     // const email = 'abdauallah.tahirr7@gmail.com';
//     const [id] = await connection.execute(`SELECT buyer_id FROM buyer_accounts WHERE status=1`)
//     const query = `SELECT * FROM buyer_profile WHERE buyer_id="${id[0].buyer_id}"`;
//     const query1 = 'SELECT * FROM seller_profile LIMIT 5';
//     const query3 = "SELECT count(*) as count from products JOIN product_quantity USING(product_id)";
//     const query4 = "SELECT count(*) as count from product_categories";
//     const query5 = "SELECT count(*) as count from buyer_accounts";
//     const query6 = "SELECT count(*) as count from seller_accounts";
//     const [freelancer] = await connection.execute(query1);
//     const [details] = await connection.execute(query);
//     const [orders] = await connection.execute(`SELECT
//                                     o.order_id,
//                                     SUM(oi.quantity) AS total_products,
//                                     SUM(oi.sumPrice) AS total,
//                                     oi.order_status,o.payment_choice
//                                     FROM orders o
//                                     JOIN order_items oi ON o.order_id = oi.order_id
//                                     WHERE buyer_id = "${details[0].buyer_id}"
//                                     GROUP BY o.order_id, oi.order_status`)
   
//     const [noofjobs] = await connection.execute(query3);
//     const [nooffls] = await connection.execute(query5);
//     const [nooftasks] = await connection.execute(query4);
//     const [noofcs] = await connection.execute(query6);

//     res.render('index.ejs', { details: details, freelancer: freelancer, orders, noofjobs: noofjobs, nooffls: nooffls, nooftasks: nooftasks, noofcs: noofcs })
// });

app.get('/index', async (req, res) => {
    if (req.session.user) {
        const connection=req.db;
        const query = `SELECT * FROM buyer_profile WHERE buyer_id="${req.session.user.buyer_id}"`;
        const query1 = 'SELECT * FROM seller_profile LIMIT 5';
        const query3 = "SELECT count(*) as count from products JOIN product_quantity USING(product_id)";
        const query4 = "SELECT count(*) as count from product_categories";
        const query5 = "SELECT count(*) as count from buyer_accounts";
        const query6 = "SELECT count(*) as count from seller_accounts";
        const [freelancer] = await connection.execute(query1);
        const [details] = await connection.execute(query);
        const [orders] = await connection.execute(`SELECT
                                        o.order_id,
                                        SUM(oi.quantity) AS total_products,
                                        SUM(oi.sumPrice) AS total,
                                        oi.order_status,o.payment_choice
                                        FROM orders o
                                        JOIN order_items oi ON o.order_id = oi.order_id
                                        WHERE buyer_id = "${details[0].buyer_id}"
                                        GROUP BY o.order_id, oi.order_status`)
      
        const [noofjobs] = await connection.execute(query3);
        const [nooffls] = await connection.execute(query5);
        const [nooftasks] = await connection.execute(query4);
        const [noofcs] = await connection.execute(query6);

        res.render('index.ejs', { details: details, freelancer: freelancer, orders, noofjobs: noofjobs, nooffls: nooffls, nooftasks: nooftasks, noofcs: noofcs })
    } else {
        // Handle case where session doesn't have buyerId
        res.redirect('/pages-login'); // Redirect to login page
    }
});

// app.get('/nomore', (req, res) => {
//     res.render('nomore.ejs')
// });
// app.get('/pages-404', (req, res) => {
//     res.render('pages-404.ejs')
// });
app.get('/pages-contact', (req, res) => {
    res.render('pages-contact.ejs')
});
app.get('/pages-login', (req, res) => {
    const message = req.flash("mess")
    res.render('pages-login', { message })
});
app.get('/pages-register', (req, res) => {
    const message = req.flash("mess")
    res.render('pages-register.ejs', { message })
});
app.get('/privacy', (req, res) => {
    res.render('privacy.ejs')
});

app.get('/setting-company', async (req, res) => {
    const [id] = await connection.execute(`SELECT seller_id FROM seller_accounts WHERE status=1`)
    const query = `SELECT * FROM seller_profile WHERE seller_id="${id[0].seller_id}"`;
    const [details] = await connection.execute(query);
    const message = req.flash("mess")

    res.render('setting-company.ejs', { details: details, message: message })
});

app.post('/setting-company', async (req, res) => {
    const cname = req.body.cname
    const email = req.body.email
    const type = req.body.type
    const location = req.body.location
    const describe = req.body.description
    let picpath = ""
    try {
        const samplepic = req.files.picture

        const uploadpathpic = __dirname + "/public/uploads/" + samplepic.name
        picpath = "/uploads/" + samplepic.name
        samplepic.mv(uploadpathpic, function (err) {
            if (err) return res.status(500).send(err)
        })

    }
    catch (TypeError) {
        {
            picpath = req.body.defaultfile
        }
    }


    const query5 = `select * from seller_accounts where status = 1`
    const [id] = await connection.execute(query5);
    console.log(req.body)
    if (req.body.cpass && req.body.npass && req.body.rpass) {
        // Compare hashed passwords
        const isPasswordMatch = await bcrypt.compare(req.body.cpass, id[0].password);
    
        if (isPasswordMatch && req.body.npass === req.body.rpass) {
            // Hash the new password
            const hashedPassword = await bcrypt.hash(req.body.npass, 12);
    
            // Update the hashed password in the database
            await connection.execute(
                `UPDATE seller_accounts SET password="${hashedPassword}" WHERE seller_id=${id[0].id}`
            );
        } else {
            req.flash("mess", "Current Password Entered is not correct");
            return res.redirect("/setting-company");
        }
    } else if (req.body.cpass || req.body.npass || req.body.rpass) {
        req.flash("mess", "Enter all password fields");
        return res.redirect("/setting-company");
    }
    
    const query = `UPDATE seller_profile SET  companyname="${cname}",email="${email}",companytype="${type}",intro="${describe}",headquarter="${location}",image="${picpath}" WHERE seller_id=${id[0].seller_id}`;
    console.log(query)


    await connection.execute(query)
    res.redirect("/index-company")

});
app.post("/detailsfreelancer", async (req, res) => {
    try {

        const samplepic = req.files.picture;
        const fname = req.body.fname;
        const lname = req.body.lname;
        const email = req.body.email;

        const tagline = req.body.city;
        const country = req.body.country;
        const describe = req.body.street_address;

        // Move the uploaded picture to the appropriate directory
        const uploadpathpic = __dirname + "/public/uploads/" + samplepic.name;
        const picpath = "/uploads/" + samplepic.name;

        samplepic.mv(uploadpathpic, function (err) {
            if (err) return res.status(500).send(err);
        });
        const [buyerId] = await connection.execute(`SELECT buyer_id FROM buyer_accounts WHERE status=1`);

        // Insert buyer profile into the buyer_profile table
        const query = `INSERT INTO buyer_profile (buyer_id,f_name, l_name, email, image) VALUES (?,?, ?, ?, ?)`;
        const [result] = await connection.execute(query, [buyerId[0].buyer_id,fname, lname, email, picpath]);

        // Check and insert the country into the countries table
        let countryId;
        const [existingCountry] = await connection.execute('SELECT country_id FROM countries WHERE country_name = ?', [country]);
        if (existingCountry.length === 0) {
            const [countryResult] = await connection.execute('INSERT INTO countries (country_name) VALUES (?)', [country]);
            countryId = countryResult.insertId;
        } else {
            countryId = existingCountry[0].country_id;
        }

        // Check and insert the city into the cities table
        let cityId;
        const [existingCity] = await connection.execute('SELECT city_id FROM cities WHERE city_name = ?', [tagline]);
        if (existingCity.length === 0) {
            const [cityResult] = await connection.execute('INSERT INTO cities (city_name) VALUES (?)', [tagline]);
            cityId = cityResult.insertId;
        } else {
            cityId = existingCity[0].city_id;
        }
        // Check and insert the address into the addresses table
        let addressId;
        const [addressResult] = await connection.execute('INSERT INTO addresses (buyer_id,city_id, country_id, street_address) VALUES (?,?, ?, ?)', [buyerId[0].buyer_id,cityId, countryId, describe]);
        addressId = addressResult.insertId;
    

        res.redirect("/index");
    } catch (error) {
        console.error(error);
        res.status(500).send("Error occurred while processing the request.");
    }
});
app.get('/tasks-grid-layout-full-page', async (req, res) => {
    const [details] = await connection.execute(`SELECT * FROM buyer_profile WHERE buyer_id=(Select buyer_id from buyer_accounts where status=1)`)

    const [products] = await connection.execute(`SELECT sp.*,p.*, ppt.time_posted, pq.quantity
    FROM products p
    JOIN product_posted_time ppt ON ppt.product_id = p.product_id
    JOIN product_quantity pq ON pq.product_id = p.product_id
    JOIN seller_profile sp ON sp.seller_id = p.seller_id;`)
    res.render('tasks-grid-layout-full-page.ejs', { products: products, calculateDuration: calculateDuration, details: details })
});

app.post('/tasks-grid-layout-full-page', async (req, res) => {
    // Retrieve the form data from the request body
    // const formData = req.body;
    const tag = req.body.skills

    const budgetrange = req.body.budgetrange;
    const category = req.body.category;
    const location = req.body.location;

    const values = budgetrange.split(',')
    const tags = tag.split(',')

    // Construct the SQL query using the form data

    let sql = `SELECT v.*,sp.*,ppt.time_posted, pq.quantity FROM products v 
    JOIN seller_profile sp ON sp.seller_id = v.seller_id
    JOIN product_posted_time ppt ON ppt.product_id = v.product_id
    JOIN product_quantity pq ON pq.product_id = v.product_id
    JOIN product_categories pc ON pc.category_id = v.category_id
    WHERE 1=1`;
    let params = [];
    if (location) {
        sql += ' AND sp.headquarter LIKE ?';
        params.push(`%${location}%`);
    }
    if (category) {
        sql += ' AND pc.category_name IN(?)';
        params.push(category);
    }
    if (tag) {
        for (let i = 0; i < tags.length; i++) {
            sql += ` AND EXISTS (SELECT 1 FROM products p
                JOIN product_tags pt ON pt.product_id = p.product_id
                JOIN tags t ON t.tag_id = pt.tag_id  
                WHERE pt.product_id = v.product_id AND t.tag_name IN (?))`;
            params.push(tags[i]);
        }
        console.log(sql)

    }
    if (budgetrange) {
        sql += ' AND price >= ?';
        params.push(parseInt(values[0]));
        sql += ' AND price <= ?';
        params.push(parseInt(values[1]));
    }

    console.log(params)
    console.log(sql)

    const [products] = await connection.execute(sql, params)
    // console.log(products)

    const [details] = await connection.execute(`SELECT * FROM buyer_profile WHERE buyer_id=(Select buyer_id from buyer_accounts where status=1)`)

    res.render('tasks-grid-layout-full-page.ejs', { products: products, calculateDuration: calculateDuration, details: details });

});

app.get('/termsofuse', (req, res) => {
    res.render('termsofuse.ejs')
});

app.get('/logout/company', async (req, res) => {

    // await connection.execute(`UPDATE seller_accounts SET status=0 where status=1`)
    req.session.destroy();

    res.redirect('/pages-login');

});
app.get('/logout/freelancer', async (req, res) => {

    // await connection.execute(`UPDATE buyer_accounts SET status=0 where status=1`)
    req.session.destroy();

    res.redirect('/pages-login');

});

app.post('/pages-register', async (req, res) => {
    const email = req.body.emailaddress
    const hash = await bcrypt.hash(req.body.password, 12);
    const type = req.body.accountType
    const values = [email, hash, 1]

    console.log(email, hash)

    if (type == "Buyer") {
        const [rows1] = await connection.execute(`select * from buyer_accounts where email="${email}"`);
        if (rows1[0]) {
            req.flash("mess", "Buyer account already exists, go to signin!");
            return res.redirect("/pages-register")
        }
        else {
            const query = `INSERT INTO buyer_accounts (email,password,status) VALUES (?,?,?)`;
            // insert user into the database

            const response=await connection.execute(query, values)
            
            res.redirect('/detailsfreelancer')
        }
    }
    else if (type == "Seller") {

        const [rows1] = await connection.execute(`select * from seller_accounts where email="${email}"`);
        if (rows1[0]) {
            req.flash("mess", "Seller account already exists, go to signin!");
            return res.redirect("/pages-register")
        }
        else {
            const query = `INSERT INTO seller_accounts (email,password,status) VALUES (?,?,?)`;
            // insert user into the database

            const result=await connection.execute(query, values);
            res.redirect('/detailscompany')
        }
    }
});
app.post('/detailscompany', async (req, res) => {
    const samplepic = req.files.picture
    const cname = req.body.cname
    const email = req.body.email
    const type = req.body.type
    const location = req.body.location
    const describe = req.body.description

    const uploadpathpic = __dirname + "/public/uploads/" + samplepic.name
    const picpath = "/uploads/" + samplepic.name

    samplepic.mv(uploadpathpic, function (err) {
        if (err) return res.status(500).send(err)
    })

    const query5 = `select seller_id from seller_accounts where email = "${email}"`
    const [id] = await connection.execute(query5);
    console.log(req.body, req.body.email, email, id)

    const query = `INSERT INTO seller_profile (seller_id,companyname,email,companytype,intro,image,headquarter) 
    VALUES ("${id[0].seller_id}","${cname}","${email}","${type}","${describe}","${picpath}","${location}")`;
    await connection.execute(query)
    res.redirect("/index-company")


});


// app.post('/login', async (req, res) => {
//     try {
//         const { username, password } = req.body;
//         const user = await connection.query('SELECT * FROM users WHERE username = ?', [username]);
//         if (!user[0]) {
//             return res.send('User not found');
//         }
//         const passwordMatch = await bcrypt.compare(password, user[0].password);
//         if (!passwordMatch) {
//             return res.send('Incorrect password');
//         }
//         req.session.user = user[0];
//         res.redirect('/dashboard');
//     } catch (error) {
//         console.log(error);
//         res.status(500).send('Something went wrong');
//     }
// });

app.post('/pages-login', async (req, res) => {
    const email = req.body.emailaddress;
    // const hash = await bcrypt.hash(req.body.password, 12);
const connection=req.db;
    const AccPassword = req.body.password;
    const type = req.body.accountType
    
    if (type == "buyer") {
        const [rows] = await connection.execute(
            `select * from buyer_accounts where email="${email}"`
        );
        if (rows[0]) {
            const validPass = await bcrypt.compare(AccPassword, rows[0].password)
            if (validPass) {
                // await connection.execute(`Update buyer_accounts SET status=1 where email="${email}"`)
                req.session.user = rows[0];
                let userProperties = Object.keys(req.session.user);

console.log(userProperties);
                req.flash("success", "Logged in Successfully");

                res.redirect("/index");
            } else {

                req.flash("mess", "Incorrect Password");
                res.redirect("/pages-login");
            }
        } else {
            req.flash("mess", "Incorrect Id ");
            res.redirect("/pages-login");
        }
    }
    else if (type == "seller") {
        const [rows] = await connection.execute(
            `select * from seller_accounts where email="${email}"`
        );
        console.log(AccPassword, rows[0])
        if (rows[0]) {
            const validPass = await bcrypt.compare(AccPassword, rows[0].password);
            if (validPass) {
                await connection.execute(`Update seller_accounts SET status=1 where email="${email}"`)
                req.flash("mess", "Logged in Successfully");
                // req.session.__id = email;
                res.redirect("/index-company");
            } else {
                req.flash("mess", "Incorrect Password");
                res.redirect("/pages-login");
            }
        } else {
            req.flash("mess", "Incorrect Id");
            res.redirect("/pages-login");
        }
    }

});

app.get('/addcart/:product_id', async (req, res) => {
    const [details] = await connection.execute(`SELECT * FROM buyer_profile WHERE buyer_id=(Select buyer_id from buyer_accounts where status=1)`)

    const product_id = [req.params.product_id];
    if (!connection) {
        res.send('Error: Database connection is not established');
        return;
    }
    try 
    {
        const [rows] = await connection.execute(`SELECT * FROM products p
        JOIN product_posted_time ppt ON ppt.product_id = p.product_id
        JOIN product_quantity pq ON pq.product_id = p.product_id
        WHERE p.product_id="${product_id}"`);
        const [row1] = await connection.execute(`SELECT seller_profile.* FROM seller_profile join products ON seller_profile.seller_id=products.seller_id WHERE product_id="${product_id}"`);
        const [review]= await connection.execute(`SELECT * FROM reviews JOIN products USING(product_id) JOIN buyer_profile USING(buyer_id) WHERE product_id="${product_id}"`)
    
        let info = rows[0]
        let info1 = row1[0]
        res.render('single-task-page.ejs', { info: info, info1: info1,review:review, details: details });
    } catch (error) {
        console.error(error);
        res.send(error);
    }
})

app.post("/done", async (req, res) => {
    const timeqty = req.body.qtyInput;
    const taskid = req.body.product_id;
    console.log(taskid)

    if (!connection) {
        return res.send('Error: Database connection is not established');
    }
    try {
        // Check if the buyer account exists and get its details
        const [buyer] = await connection.execute(`SELECT * FROM buyer_accounts WHERE status=1`);
        
        if (!buyer.length) {
            // Buyer account not found, return an error or redirect to an error page
            return res.send('Error: Buyer account not found.');
        }
        // Check if the buyer has an active cart, if not, create one
        let [cart] = await connection.execute(`SELECT cart_id FROM cart_details WHERE buyer_id="${buyer[0].buyer_id}" AND cart_status=1`);
        
        if (!cart.length) {
            await connection.execute(`INSERT INTO cart_details(buyer_id, cart_status) VALUES ("${buyer[0].buyer_id}", 1)`);
            [cart] = await connection.execute(`SELECT cart_id FROM cart_details WHERE buyer_id="${buyer[0].buyer_id}" AND cart_status=1`);
        }
        
        // Check if the selected product is already in the cart
        const [existingCartItem] = await connection.execute(`SELECT quantity FROM cart_items WHERE cart_id="${cart[0].cart_id}" AND product_id="${taskid}"`);
        
        if (existingCartItem.length) {
            // Product already in cart, update the quantity
            const newQuantity = parseInt(existingCartItem[0].quantity) + parseInt(timeqty);
            await connection.execute(`UPDATE cart_items SET quantity="${newQuantity}" WHERE cart_id="${cart[0].cart_id}" AND product_id="${taskid}"`);
        } else {
            // Product not in cart, insert new entry
            await connection.execute(`INSERT INTO cart_items(cart_id, product_id, quantity) VALUES ("${cart[0].cart_id}", "${taskid}", "${timeqty}")`);
        }
         // Subtract the quantity of products from the product_quantity table
        await connection.execute(`UPDATE product_quantity SET quantity = quantity - "${timeqty}" WHERE product_id="${taskid}"`);
        
        // Redirect the user to the cart page or any other desired page
        return res.redirect(`/addcart/${taskid}`);
    } catch (error) {
        console.error(error);
        return res.send(error);
    }
});


app.get('/browsecompanyfreelancer', async (req, res) => {
    const [details] = await connection.execute(`SELECT * FROM buyer_profile WHERE buyer_id=(Select buyer_id from buyer_accounts where status=1)`)

    const [row] = await connection.execute("SELECT * from seller_profile")
    const [countrow] = await connection.execute("SELECT count(*) as count from seller_profile")
    let info = row
    let infocount = countrow[0]
    res.render('browsecompanyfreelancer.ejs', { info: info, infocount: infocount, details: details })
})
app.get('/single-company-profile/:seller_id', async (req, res) => {

    const id = [req.params.seller_id];
    if (!connection) {
        res.send('Error: Database connection is not established');
        return;
    }
    try {
        const [details] = await connection.execute(`SELECT * FROM seller_profile WHERE seller_id=(Select seller_id from seller_accounts where status=1)`)

        const [rows] = await connection.execute(`SELECT * FROM seller_profile WHERE seller_id=${id}`);
        let info = rows[0]
        const [products] = await connection.execute(`SELECT p.*, ppt.time_posted, pq.quantity
    FROM products p
    JOIN product_posted_time ppt ON ppt.product_id = p.product_id
    JOIN product_quantity pq ON pq.product_id = p.product_id
    WHERE p.seller_id = "${id}";
    `)
        res.render('single-company-profile.ejs', { info: info, details: details,products:products ,calculateDuration: calculateDuration})
    } catch (error) {
        console.error(error);
        res.send(error);
    }
});

app.get('/companyprofile', async (req, res) => {

    const [company_id] = await connection.execute('SELECT * from seller_accounts where status=1');
    const id = company_id[0].seller_id;
    if (!connection) {
        res.send('Error: Database connection is not established');
        return;
    }
    try {
        const [details] = await connection.execute(`SELECT * FROM seller_profile WHERE seller_id=(Select seller_id from seller_accounts where status=1)`)

        const [rows] = await connection.execute(`SELECT * FROM seller_profile WHERE seller_id=${id}`);
        let info = rows[0]
        res.render('companyprofile.ejs', { info: info, details: details })
    } catch (error) {
        console.error(error);
        res.send(error);
    }
});


app.get("/singlecompanypagefreelancer/:seller_id", async (req, res) => {

    const id = [req.params.seller_id];
    if (!connection) {
        res.send('Error: Database connection is not established');
        return;
    }
    try {
        const [details] = await connection.execute(`SELECT * FROM buyer_profile WHERE buyer_id=(Select buyer_id from buyer_accounts where status=1)`)

        const [rows] = await connection.execute(`SELECT * FROM seller_profile WHERE seller_id=${id}`);
        let info = rows[0]
        const [products] = await connection.execute(`SELECT p.*, ppt.time_posted, pq.quantity
    FROM products p
    JOIN product_posted_time ppt ON ppt.product_id = p.product_id
    JOIN product_quantity pq ON pq.product_id = p.product_id
    WHERE p.seller_id = "${id}";
    `)
        res.render('singlecompanypagefreelancer.ejs', { info: info, details: details,products:products,calculateDuration:calculateDuration })
    } catch (error) {
        console.error(error);
        res.send(error);
    }

})

app.post('/giveproductreview', async (req, res) => {

    const id = req.body.id;
    const pass = req.body.rate;
    const pass2 = req.body.name;
    const pass3 = req.body.reviewtitle;
    const pass4 = req.body.message;
    const pass5=req.body.product_id;
    console.log(id)

    const [buyer_id] = await connection.execute('SELECT * from buyer_accounts where status=1');
    const query = ('INSERT INTO reviews(seller_id,buyer_id,product_id,buyer_name,review_title,review_text,rating) VALUES (?,?,?,?,?,?,?)');
    await connection.execute(query, [id, buyer_id[0].buyer_id, pass5, pass2, pass3, pass4, pass]);

    res.redirect(`/addcart/${pass5}`)
});
app.get('/dashboard-reviews', async (req, res) => {
    const [details] = await connection.execute(`SELECT * FROM buyer_profile WHERE buyer_id=(Select buyer_id from buyer_accounts where status=1)`)

    const fid = details[0].buyer_id;
    const query2 = `SELECT * from reviews JOIN products USING(product_id) where buyer_id="${fid}"`;
    const [review] = await connection.execute(query2);
    const query4 = `SELECT * from buyer_profile`;
    const [company] = await connection.execute(query4);

    res.render('dashboard-reviews.ejs', { review: review, company: company, details: details });
});
app.get('/companyreviews', async (req, res) => {
    const [details] = await connection.execute(`SELECT * FROM seller_profile WHERE seller_id=(Select seller_id from seller_accounts where status=1)`)

    const query1 = 'SELECT * from seller_accounts where status=1';
    const [cd] = await connection.execute(query1);
    const cid = cd[0].seller_id;
    const query2 = `SELECT * from reviews JOIN products USING(product_id) where reviews.seller_id="${cid}"`;
    const [review] = await connection.execute(query2);
    const query4 = `SELECT * from buyer_profile`;
    const [freelancer] = await connection.execute(query4);

    res.render('companyreview.ejs', { review: review, freelancer: freelancer, details: details });

});


app.get('/single-freelancer-profile/', async (req, res) => {
    const [row9] = await connection.execute(`select * from buyer_accounts where status=1`)
    let users = row9[0].buyer_id
    if (!connection) {
        res.send('Error: Database connection is not established');
        return;
    }
    try {
        const [details] = await connection.execute(`SELECT * FROM buyer_profile WHERE buyer_id=(Select buyer_id from buyer_accounts where status=1)`)

        const [rows] = await connection.execute(`SELECT * FROM buyer_profile 
                                            JOIN addresses USING(buyer_id)
                                            JOIN countries USING(country_id)
                                            JOIN cities USING(city_id) WHERE buyer_id="${users}"`);
        const [row2] = await connection.execute(`SELECT count(*) as count FROM orders WHERE buyer_id="${users}"`)
       
        let info = rows[0]
        let info2 = row2[0].count
        const query2=`SELECT orders.*,SUM(quantity) AS qua,order_items.order_status FROM orders JOIN order_items USING(order_id) WHERE buyer_id="${users}" GROUP BY order_id,order_status`;

    const [jobs] = await connection.execute(query2);

        res.render('single-freelancer-profile.ejs', { info: info,jobs:jobs, info2: info2, details: details });
    } catch (error) {
        console.error(error);
        res.send(error);
    }
});

// Handle the submission of the contact form
app.post("/contact", async (req, res) => {
    // Extract the form data from the request body
    const name = req.body.name;
    const email = req.body.email;
    const subject = req.body.subject;
    const comments = req.body.comments;
    console.log(name);

    // Send the message using the transporter object
    transporter.sendMail({
        from: email,
        to: "prolancerwebsite@gmail.com",
        subject: 'New message from contact form',
        text: `From: ${name} (${email}) Subject: ${subject}\n\n${comments}`
    }, (error, info) => {
        if (error) {
            console.log(error);
            res.send('An error occurred while sending the message.');
        } else {
            console.log(`Message sent: ${info.response}`);
            res.redirect("/pages-contact")
        }
    });
});
app.get('/dashboard-manage-tasks', async (req, res) => {
    const [details] = await connection.execute(`SELECT * FROM seller_profile WHERE seller_id=(Select seller_id from seller_accounts where status=1)`)

    const [rows] = await connection.execute(`SELECT p.*, ppt.time_posted, pq.quantity
    FROM products p
    JOIN product_posted_time ppt ON ppt.product_id = p.product_id
    JOIN product_quantity pq ON pq.product_id = p.product_id
    WHERE p.seller_id = (SELECT seller_id FROM seller_accounts WHERE status = 1);
    `)
    let info1 = rows


    res.render('dashboard-manage-tasks.ejs', { info1: info1, calculateDuration: calculateDuration, details: details })
});

app.get('/receive-order/:item_id', async (req, res) => {

    const item_id = req.params.item_id
    await connection.execute(`UPDATE order_items SET order_status="Delivered" WHERE item_id=${item_id}`)
    const [rows]=await connection.execute(`SELECT * FROM order_items WHERE item_id=${item_id}`)
    res.redirect(`/vieworderdetails/${rows[0].order_id}`)
})
app.get('/acceptpayment/:item_id', async (req, res) => {

    const item_id = req.params.item_id
    await connection.execute(`UPDATE order_items SET order_status="Shipped" WHERE item_id=${item_id}`)
    res.redirect(`/dashboard-manage-jobs`)
})
app.get('/processorder/:item_id', async (req, res) => {
    const item_id = req.params.item_id
    await connection.execute(`UPDATE order_items SET order_status="Shipped" WHERE item_id=${item_id}`)
    res.redirect(`/dashboard-manage-jobs`)
})
app.get('/removetask/:id', async (req, res) => {
    const taskid = req.params.id
    await connection.execute(`DELETE FROM product_posted_time WHERE product_id=${taskid}`)
    await connection.execute(`DELETE FROM product_quantity WHERE product_id=${taskid}`)
    await connection.execute(`DELETE FROM product_tags WHERE product_id=${taskid}`)
    await connection.execute(`DELETE FROM reviews WHERE product_id=${taskid}`)
    res.redirect(`/dashboard-manage-tasks`)
})
app.get('/markasdelivered/:item_id', async (req, res) => {
    const item_id = req.params.item_id
    await connection.execute(`UPDATE order_items SET order_status="Delivered" WHERE item_id=${item_id}`)
    res.redirect(`/single-freelancer-page`)
})


function calculateDuration(startTime) {
    // Parse the start and end times into Date objects
    const start = new Date(startTime);
    const currentTime = new Date();
    // Calculate the difference in milliseconds
    const diff = currentTime - start;

    // Convert the difference to years, weeks, days, hours, minutes, and seconds
    const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365));
    const weeks = Math.floor((diff % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24 * 7));
    const days = Math.floor((diff % (1000 * 60 * 60 * 24 * 7)) / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    // Return the duration in the most appropriate unit
    if (years > 0) {
        return `${years} years`;
    } else if (weeks > 0) {
        return `${weeks} weeks`;
    } else if (days > 0) {
        return `${days} days`;
    } else if (hours > 0) {
        return `${hours} hours`;
    } else if (minutes > 0) {
        return `${minutes} minutes`;
    } else {
        return `${seconds} seconds`;
    }
}


app.use(errorHandlerMiddleware);


app.listen(3000, () => {
    console.log('Server listening on port 3000');
});