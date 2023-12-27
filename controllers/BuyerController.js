const { calculateDuration } = require('../config/utils');

const bcrypt = require('bcrypt');
const path = require('path');


class BuyerController {
  async browseCompanies(req, res, next) {
    try {
      const connection = req.db;

      const [companies] = await connection.execute(`SELECT * FROM seller_profile`);

      let details = [];
      let userType = '';
      const loggedInUser = req.session.user;

      if (loggedInUser.buyer_id) {
        userType = 'buyer';
        [details] = await connection.execute(`SELECT * FROM buyer_profile WHERE buyer_id = ?`, [loggedInUser.buyer_id]);
      } else if (loggedInUser.seller_id) {
        userType = 'seller';
        [details] = await connection.execute(`SELECT * FROM seller_profile WHERE seller_id = ?`, [loggedInUser.seller_id]);
      }

      res.render('browse-companies.ejs', { companies: companies, details: details });
    } catch (error) {
      next(error);
    }
  }

  async viewCart(req, res, next) {
    try {
      const connection = req.db;
      const userId = req.session.user.buyer_id;

      const [details] = await connection.execute(`SELECT * FROM buyer_profile WHERE buyer_id = ?`, [userId]);

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

      const [cartItems] = await connection.execute(query, [userId]);

      res.render('dashboard-my-active-cart.ejs', { details: details, cartItems: cartItems });
    } catch (error) {
      next(error);
    }
  }

  async removeCartItem(req, res, next) {
    try {
      const connection = req.db;
      const productId = req.params.product_id;
      const cartId = req.params.cart_id;
      // const userId = req.session.userId;

      const [quan] = await connection.execute(`SELECT SUM(quantity) AS qua FROM cart_items WHERE product_id = ? AND cart_id = ? GROUP BY product_id`, [productId, cartId]);
      await connection.execute(`DELETE FROM cart_items WHERE product_id = ? AND cart_id = ?`, [productId, cartId]);
      await connection.execute(`UPDATE product_quantity SET quantity = quantity + ? WHERE product_id = ?`, [quan[0].qua, productId]);

      res.redirect('/dashboard-my-active-cart');
    } catch (error) {
      next(error);
    }
  }


  async viewAllOrders(req, res, next) {
    try {
      const connection = req.db;
      const buyerId = req.session.user.buyer_id;

      const [details] = await connection.execute(`SELECT * FROM buyer_profile WHERE buyer_id = ?`, [buyerId]);
      const [orders] = await connection.execute(`
        SELECT
          o.order_id,
          SUM(oi.quantity) AS total_products,
          SUM(oi.sumPrice) AS total,
          oi.order_status,
          o.payment_choice
        FROM orders o
        JOIN order_items oi ON o.order_id = oi.order_id
        WHERE buyer_id = "${buyerId}"
        GROUP BY o.order_id, oi.order_status
      `);

      res.render('myorders.ejs', { orders: orders, details: details });
    } catch (error) {
      next(error);
    }
  }

  async viewOrderDetails(req, res, next) {
    try {
      const connection = req.db;
      const buyerId = req.session.user.buyer_id;
      const order_id = req.params.order_id;

      const [details] = await connection.execute(`SELECT * FROM buyer_profile WHERE buyer_id = ?`, [buyerId]);
      const query = `
        SELECT oi.order_id, oi.order_status, oi.product_id, oi.quantity, p.product_name, p.price, oi.item_id, o.payment_choice
        FROM order_items oi
        JOIN orders o USING(order_id)
        JOIN products p ON oi.product_id = p.product_id
        WHERE oi.order_id = ? AND o.buyer_id = ?
      `;
      const [cartItems] = await connection.execute(query, [order_id, buyerId]);

      res.render('vieworderdetails.ejs', { details, cartItems });
    } catch (error) {
      next(error);
    }
  }

  async dashboardSettings(req, res, next) {
    try {
      const connection = req.db;
      const buyerId = req.session.user.buyer_id;

      const [rows] = await connection.execute(`
        SELECT * FROM buyer_profile 
        JOIN addresses USING(buyer_id)
        JOIN countries USING(country_id)
        JOIN cities USING(city_id)
        WHERE buyer_id = ?
      `, [buyerId]);

      const [details] = await connection.execute(`SELECT * FROM buyer_profile WHERE buyer_id = ?`, [buyerId]);
      const info = rows[0];
      const message = req.flash("mess");

      res.render('dashboard-settings.ejs', { info: info, message: message, details: details });
    } catch (error) {
      console.error(error);
      next(error);
    }
  }

  async buyerDetails(req, res, next) {
    try {
      const connection = req.db;
      console.log(req.session.user);
      const buyerId = req.session.user.buyer_id;
      console.log(buyerId);
      // let [details] = await connection.execute(`SELECT * FROM buyer_profile WHERE buyer_id = ?`, [buyerId]);
      const [id] = await connection.execute(`SELECT * FROM buyer_accounts WHERE buyer_id = ?`, [buyerId]);

      res.render('detailsfreelancer.ejs', { emailaddress: id[0].email });
    } catch (error) {
      next(error);
    }
  }

  async mainHomeScreen(req, res, next) {
    // Logic for the main home screen for buyer
    try {

      if (req.session.user) {
        const connection = req.db;
        console.log(req.session.user.buyer_id);
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
    } catch (error) {
      next(error);
    }
  }
  async productsGridLayout(req, res, next) {
    try {
      const connection = req.db;
      const buyerId = req.session.user.buyer_id;

      const [details] = await connection.execute(`SELECT * FROM buyer_profile WHERE buyer_id = ?`, [buyerId]);
      const [products] = await connection.execute(`
        SELECT sp.*, p.*, ppt.time_posted, pq.quantity
        FROM products p
        JOIN product_posted_time ppt ON ppt.product_id = p.product_id
        JOIN product_quantity pq ON pq.product_id = p.product_id
        JOIN seller_profile sp ON sp.seller_id = p.seller_id
      `);

      res.render('products-grid-layout-full-page.ejs', { products: products, calculateDuration: calculateDuration, details: details });
    } catch (error) {
      next(error);
    }
  }

  // async logoutBuyer(req, res, next) {
  //   // Logic for logging out buyer account
  //   try {

  //     // Fetch data

  //     // Render template with fetched data
  //     res.render('index-company.ejs', { /* Pass data here */ });
  //   } catch (error) {
  //     next(error);
  //   }
  // }

  async openProductPage(req, res, next) {
    try {
      const connection = req.db;
      const buyerId = req.session.user.buyer_id;

      const [details] = await connection.execute(`SELECT * FROM buyer_profile WHERE buyer_id = ?`, [buyerId]);

      const product_id = req.params.product_id;
      const [rows] = await connection.execute(`
        SELECT * FROM products p
        JOIN product_posted_time ppt ON ppt.product_id = p.product_id
        JOIN product_quantity pq ON pq.product_id = p.product_id
        WHERE p.product_id = ?
      `, [product_id]);

      const [row1] = await connection.execute(`
        SELECT seller_profile.* FROM seller_profile 
        JOIN products ON seller_profile.seller_id = products.seller_id 
        WHERE product_id = ?
      `, [product_id]);

      const [review] = await connection.execute(`
        SELECT * FROM reviews 
        JOIN products USING(product_id) 
        JOIN buyer_profile USING(buyer_id) 
        WHERE product_id = ?
      `, [product_id]);

      let info = rows[0];
      let info1 = row1[0];
      res.render('single-task-page.ejs', { info: info, info1: info1, review: review, details: details });
    } catch (error) {
      next(error);
    }
  }

  async browseCompanyFreelancer(req, res, next) {
    try {
      const connection = req.db;
      console.log(req.session.user)
      const buyerId = req.session.user.buyer_id;

      const [details] = await connection.execute(`SELECT * FROM buyer_profile WHERE buyer_id = ?`, [buyerId]);

      const [row] = await connection.execute("SELECT * FROM seller_profile");
      const [countrow] = await connection.execute("SELECT COUNT(*) as count FROM seller_profile");

      let info = row;
      let infocount = countrow[0];
      res.render('browsecompanyfreelancer.ejs', { info: info, infocount: infocount, details: details });
    } catch (error) {
      next(error);
    }
  }

  async viewSingleCompanyPageFreelancer(req, res, next) {
    try {
      const connection = req.db;
      const buyerId = req.session.user.buyer_id;
      const id = req.params.seller_id;

      const [details] = await connection.execute(`SELECT * FROM buyer_profile WHERE buyer_id = ?`, [buyerId]);

      const [rows] = await connection.execute(`SELECT * FROM seller_profile WHERE seller_id = ?`, [id]);
      let info = rows[0];

      const [products] = await connection.execute(`
        SELECT p.*, ppt.time_posted, pq.quantity
        FROM products p
        JOIN product_posted_time ppt ON ppt.product_id = p.product_id
        JOIN product_quantity pq ON pq.product_id = p.product_id
        WHERE p.seller_id = ?
      `, [id]);

      res.render('singlecompanypagefreelancer.ejs', { info: info, details: details, products: products, calculateDuration: calculateDuration });
    } catch (error) {
      next(error);
    }
  }

  async viewBuyerReviews(req, res, next) {
    try {
      const connection = req.db;
      const buyerId = req.session.user.buyer_id;

      const [details] = await connection.execute(`SELECT * FROM buyer_profile WHERE buyer_id = ?`, [buyerId]);

      const fid = buyerId;
      const query2 = `SELECT * FROM reviews JOIN products USING(product_id) WHERE buyer_id = ?`;
      const [review] = await connection.execute(query2, [fid]);
      const query4 = `SELECT * FROM buyer_profile`;
      const [company] = await connection.execute(query4);

      res.render('dashboard-reviews.ejs', { review: review, company: company, details: details });
    } catch (error) {
      next(error);
    }
  }

  async viewBuyerProfile(req, res, next) {
    try {
      const connection = req.db;
      const buyerId = req.session.user.buyer_id; // Accessing buyer_id from the session

      const [details] = await connection.execute(`SELECT * FROM buyer_profile WHERE buyer_id = ?`, [buyerId]);
      const [rows] = await connection.execute(`
        SELECT * FROM buyer_profile 
        JOIN addresses USING(buyer_id)
        JOIN countries USING(country_id)
        JOIN cities USING(city_id) WHERE buyer_id = ?
      `, [buyerId]);

      const [row2] = await connection.execute(`SELECT count(*) as count FROM orders WHERE buyer_id = ?`, [buyerId]);
      let info = rows[0];
      let info2 = row2[0].count;

      const query2 = `SELECT orders.*, SUM(quantity) AS qua, order_items.order_status 
                      FROM orders 
                      JOIN order_items USING(order_id) 
                      WHERE buyer_id = ? GROUP BY order_id, order_status`;

      const [jobs] = await connection.execute(query2, [buyerId]);

      res.render('single-freelancer-profile.ejs', { info: info, jobs: jobs, info2: info2, details: details });
    } catch (error) {
      next(error);
    }
  }

  async setOrderReceived(req, res, next) {
    try {
      const connection = req.db;
      const item_id = req.params.item_id;
      await connection.execute(`UPDATE order_items SET order_status = "Delivered" WHERE item_id = ?`, [item_id]);
      const [rows] = await connection.execute(`SELECT * FROM order_items WHERE item_id = ?`, [item_id]);
      res.redirect(`/vieworderdetails/${rows[0].order_id}`);
    } catch (error) {
      next(error);
    }
  }

  async markAsDelivered(req, res, next) {
    try {
      const connection = req.db;
      const item_id = req.params.item_id;
      await connection.execute(`UPDATE order_items SET order_status = "Delivered" WHERE item_id = ?`, [item_id]);
      res.redirect(`/single-freelancer-page`);
    } catch (error) {
      next(error);
    }
  }

  async updateCart(req, res, next) {
    try {
      const connection = req.db;
      const buyerId = req.session.user.buyer_id; // Accessing buyer_id from the session
      const cartItems = [];

      // Extract cart items from the request
      for (let i = 0; req.body[`cartItems[${i}][cart_id]`]; i++) {
        const cart_id = req.body[`cartItems[${i}][cart_id]`];
        const product_id = req.body[`cartItems[${i}][product_id]`];
        const quantity = req.body[`cartItems[${i}][quantity]`];

        cartItems.push({ cart_id, product_id, quantity });
      }

      // Get the old quantities for each cart item
      const oldQuantities = {};
      for (const item of cartItems) {
        const [row] = await connection.execute(
          `SELECT quantity FROM cart_items WHERE cart_id = ? AND product_id = ?`,
          [item.cart_id, item.product_id]
        );
        oldQuantities[item.cart_id + '_' + item.product_id] = row.length ? row[0].quantity : 0;
      }

      // Perform the update queries to update the quantity of each item in the cart and update product_quantity table
      for (const item of cartItems) {
        const cartItemId = item.cart_id + '_' + item.product_id;
        const newQuantity = parseInt(item.quantity);
        const oldQuantity = oldQuantities[cartItemId];
        const quantityDifference = newQuantity - oldQuantity;

        // Update cart_items table with new quantity
        await connection.execute(
          `UPDATE cart_items SET quantity = ? WHERE cart_id = ? AND product_id = ?`,
          [newQuantity, item.cart_id, item.product_id]
        );

        // Update product_quantity table with the quantity difference
        await connection.execute(
          `UPDATE product_quantity SET quantity = quantity - ? WHERE product_id = ?`,
          [quantityDifference, item.product_id]
        );
      }

      res.redirect('/dashboard-my-active-cart');
    } catch (error) {
      next(error);
    }
  }
  async confirmOrder(req, res, next) {
    try {
      const connection = req.db;
      const buyerId = req.session.user.buyer_id; // Accessing buyer_id from the session

      let cartItems = [];

      // Extract cart items from the req.body object
      for (let i = 0; req.body[`cartItems[${i}][cart_id]`]; i++) {
        const cart_id = req.body[`cartItems[${i}][cart_id]`];
        const product_id = req.body[`cartItems[${i}][product_id]`];
        const quantity = req.body[`cartItems[${i}][quantity]`];

        cartItems.push({ cart_id, product_id, quantity });
      }

      const payment = req.body.paymentOption;
      const [details] = await connection.execute(`SELECT * FROM buyer_profile WHERE buyer_id = ?`, [buyerId]);

      // Get the old quantities for each cart item
      const oldQuantities = {};
      for (const item of cartItems) {
        const [row] = await connection.execute(`SELECT quantity FROM cart_items WHERE cart_id = ? AND product_id = ?`, [
          item.cart_id,
          item.product_id
        ]);
        oldQuantities[item.cart_id + '_' + item.product_id] = row.length ? row[0].quantity : 0;
      }

      // Perform the update queries to update the quantity of each item in the cart and update product_quantity table
      for (const item of cartItems) {
        const cartItemId = item.cart_id + '_' + item.product_id;
        const newQuantity = parseInt(item.quantity);
        const oldQuantity = oldQuantities[cartItemId];
        const quantityDifference = newQuantity - oldQuantity;

        // Update cart_items table with new quantity
        await connection.execute(`UPDATE cart_items SET quantity = ? WHERE cart_id = ? AND product_id = ?`, [
          newQuantity,
          item.cart_id,
          item.product_id
        ]);

        // Update product_quantity table with the quantity difference
        await connection.execute(`UPDATE product_quantity SET quantity = quantity - ? WHERE product_id = ?`, [
          quantityDifference,
          item.product_id
        ]);
      }

      const [cartItems2] = await connection.execute(
        'SELECT p.seller_id, ci.cart_id, ci.product_id, ci.quantity, p.price FROM cart_items ci JOIN products p ON ci.product_id = p.product_id WHERE ci.cart_id IN (SELECT cart_id FROM cart_details WHERE buyer_id = ? AND cart_status = 1)',
        [buyerId]
      );

      // Calculate the order total
      let orderTotal = 0;
      for (const item of cartItems2) {
        orderTotal += item.price * item.quantity;
      }

      // Create a new order entry in the "orders" table
      const orderDate = new Date();
      const orderStatus = 'Pending'; // Assuming 1 means "Confirmed" and 0 means "Pending" or "Cancelled"
      const [orderResult] = await connection.execute(
        'INSERT INTO orders (buyer_id, order_date, total, payment_choice) VALUES (?, ?, ?, ?)',
        [buyerId, orderDate, orderTotal, payment]
      );

      const orderId = orderResult.insertId;

      // Create entries in the "order_items" table for each item in the cart
      for (const item of cartItems2) {
        const sellerId = item.seller_id;
        const quantity = item.quantity;
        const sumPrice = item.price * item.quantity;

        await connection.execute(
          'INSERT INTO order_items (order_id, product_id, seller_id, quantity, order_status, sumPrice) VALUES (?, ?, ?, ?, ?, ?)',
          [orderId, item.product_id, sellerId, quantity, orderStatus, sumPrice]
        );
      }

      // Update the cart status to 0 to indicate it has been used for the order
      await connection.execute('UPDATE cart_details SET cart_status = 0 WHERE buyer_id = ?', [buyerId]);

      res.redirect('/index'); // Change this URL as per your requirement
    } catch (error) {
      next(error);
    }
  }


  async updateBuyerDetails(req, res, next) {
    try {
      const connection = req.db;
      const buyerId = req.session.user.buyer_id; // Accessing buyer_id from the session

      const fname = req.body.fname;
      const lname = req.body.lname;
      const email = req.body.email;
      const tagline = req.body.city;
      const country = req.body.country;
      const describe = req.body.street_address;

      let picpath = "";
      try {
        const samplepic = req.files.picture;
        const uploadpathpic = path.join(__dirname, '../public/uploads/', samplepic.name);

        // const uploadpathpic = __dirname + "/public/uploads/" + samplepic.name;
        picpath = "/uploads/" + samplepic.name;
        samplepic.mv(uploadpathpic, function (err) {
          if (err) return res.status(500).send(err);
        });
      } catch (TypeError) {
        picpath = req.body.defaultfile;
      }

      const query5 = `SELECT * FROM buyer_accounts WHERE buyer_id="${buyerId}"`;
      const [id] = await connection.execute(query5);

      // Password updating logic
      if (req.body.cpass && req.body.npass && req.body.rpass) {
        const isPasswordMatch = await bcrypt.compare(req.body.cpass, id[0].password);

        if (isPasswordMatch && req.body.npass === req.body.rpass) {
          const hashedPassword = await bcrypt.hash(req.body.npass, 12);
          await connection.execute(`UPDATE buyer_accounts SET password="${hashedPassword}" WHERE buyer_id="${buyerId}"`);
        } else {
          req.flash("mess", "Current Password Entered is not correct");
          return res.redirect("/dashboard-settings");
        }
      } else if (req.body.cpass || req.body.npass || req.body.rpass) {
        req.flash("mess", "Enter all password fields");
        return res.redirect("/dashboard-settings");
      }

      const queryUpdateProfile = `UPDATE buyer_profile SET f_name="${fname}", l_name="${lname}", email="${email}", image="${picpath}" WHERE buyer_id="${buyerId}"`;
      await connection.execute(queryUpdateProfile);

      // Check and insert country, city, and address...
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

    } catch (error) {
      console.error(error);
      next(error);
    }
  }
  async addBuyerDetails(req, res, next) {
    // Logic for updating buyer details

    try {
      const connection = req.db;
      const samplepic = req.files.picture;
      const fname = req.body.fname;
      const lname = req.body.lname;
      const email = req.body.email;

      const tagline = req.body.city;
      const country = req.body.country;
      const describe = req.body.street_address;

      const buyer_Id = req.session.user.buyer_id; // Accessing buyer_id from the session


      // Move the uploaded picture to the appropriate directory
      const uploadpathpic = path.join(__dirname, '../public/uploads/', samplepic.name);

      // const uploadpathpic = __dirname + "/public/uploads/" + samplepic.name;
      const picpath = "/uploads/" + samplepic.name;

      samplepic.mv(uploadpathpic, function (err) {
        if (err) return res.status(500).send(err);
      });
      // const [buyerId] = await connection.execute(`SELECT buyer_id FROM buyer_accounts WHERE buyer_id="${buyer_Id}"`);

      // Insert buyer profile into the buyer_profile table
      const query = `INSERT INTO buyer_profile (buyer_id,f_name, l_name, email, image) VALUES (?,?, ?, ?, ?)`;
      const [result] = await connection.execute(query, [buyer_Id, fname, lname, email, picpath]);

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
      const [addressResult] = await connection.execute('INSERT INTO addresses (buyer_id,city_id, country_id, street_address) VALUES (?,?, ?, ?)', [buyer_Id, cityId, countryId, describe]);
      addressId = addressResult.insertId;


      res.redirect("/index");
    }
    catch (error) {
      console.error(error);
      next(error);
    }
  }

  async applyFilterProductSearch(req, res, next) {
    // Logic for applying filters on the products search page (buyer module)
    try {
      const connection = req.db;
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
      const buyerId = req.session.user.buyer_id; // Accessing buyer_id from the session

      const [details] = await connection.execute(`SELECT * FROM buyer_profile WHERE buyer_id="${buyerId}"`)

      res.render('products-grid-layout-full-page.ejs', { products: products, calculateDuration: calculateDuration, details: details });

    } catch (error) {
      next(error);
    }
  }

  async addProductToCart(req, res, next) {
    // Logic for adding products to cart
    try {
      const connection = req.db;
      const timeqty = req.body.qtyInput;
      const taskid = req.body.product_id;
      // Check if the buyer account exists and get its details
      // const [buyer] = await connection.execute(`SELECT * FROM buyer_accounts WHERE status=1`);
      const buyerId = req.session.user.buyer_id; // Accessing buyer_id from the session


      // if (!buyer.length) {
      //     // Buyer account not found, return an error or redirect to an error page
      //     return res.send('Error: Buyer account not found.');
      // }
      // Check if the buyer has an active cart, if not, create one
      let [cart] = await connection.execute(`SELECT cart_id FROM cart_details WHERE buyer_id="${buyerId}" AND cart_status=1`);

      if (!cart.length) {
        await connection.execute(`INSERT INTO cart_details(buyer_id, cart_status) VALUES ("${buyerId}", 1)`);
        [cart] = await connection.execute(`SELECT cart_id FROM cart_details WHERE buyer_id="${buyerId}" AND cart_status=1`);
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
      next(error);
    }
  }

  async giveProductReview(req, res, next) {
    // Logic for giving a review to a product (by a buyer)
    try {
      const connection = req.db;
      const id = req.body.id;
      const pass = req.body.rate;
      const pass2 = req.body.name;
      const pass3 = req.body.reviewtitle;
      const pass4 = req.body.message;
      const pass5 = req.body.product_id;
      console.log(id)
      const buyerId = req.session.user.buyer_id; // Accessing buyer_id from the session

      // const [buyer_id] = await connection.execute('SELECT * from buyer_accounts where status=1');
      const query = ('INSERT INTO reviews(seller_id,buyer_id,product_id,buyer_name,review_title,review_text,rating) VALUES (?,?,?,?,?,?,?)');
      await connection.execute(query, [id, buyerId, pass5, pass2, pass3, pass4, pass]);

      res.redirect(`/addcart/${pass5}`)
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new BuyerController();
