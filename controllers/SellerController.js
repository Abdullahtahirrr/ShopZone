// sellerController.js
const { calculateDuration } = require('../config/utils');
const bcrypt = require('bcrypt');
const path = require('path');

class SellerController {

  async manageOrders(req, res, next) {
    try {
      const connection = req.db;
      const loggedInSellerId = req.session.user ? req.session.user.seller_id : null;


      const [details] = await connection.execute(`SELECT * FROM seller_profile WHERE seller_id = ?`, [loggedInSellerId]);


      const [rows] = await connection.execute(`
            SELECT * FROM orders 
            JOIN order_items ON orders.order_id = order_items.order_id 
            JOIN products ON order_items.product_id = products.product_id 
            WHERE products.seller_id = ? 
            ORDER BY orders.order_id DESC
        `, [loggedInSellerId]);

      res.render('dashboard-manage-orders.ejs', { orders: rows, calculateDuration: calculateDuration, details: details });
    } catch (error) {
      next(error);
    }

  }


  async updateProduct(req, res, next) {
    // Logic for updating a product (seller)
    try {
      const connection = req.db;
      const product_id = req.params.product_id;
      const [rows] = await connection.execute(`
            SELECT products.product_id, products.description, products.price, product_quantity.quantity, 
                product_categories.category_name, products.product_name, products.image
            FROM products
            JOIN product_quantity ON products.product_id = product_quantity.product_id
            JOIN product_categories ON products.category_id = product_categories.category_id
            WHERE products.product_id = ?
        `, [product_id]);

      if (rows.length > 0) {
        const info1 = rows[0];
        const loggedInSellerId = req.session.user ? req.session.user.seller_id : null;

        const [details] = await connection.execute(`SELECT * FROM seller_profile WHERE seller_id = ?`, [loggedInSellerId]);
        console.log(info1);
        res.render('updateproduct.ejs', { details: details, info1: info1 });
      } else {
        console.log(`No product found with product_id ${product_id}`);
        res.status(404).send('Product not found.');
      }
    } catch (error) {
      next(error);
    }
  }

  async postProduct(req, res, next) {
    // Logic for posting a product (seller)
    try {
      const connection = req.db;
      const loggedInSellerId = req.session.user ? req.session.user.seller_id : null;
      const [details] = await connection.execute(`SELECT * FROM seller_profile WHERE seller_id = ?`, [loggedInSellerId]);
      res.render('dashboard-post-a-product.ejs', { details });
    } catch (error) {
      next(error);
    }
  }

  async companyDetails(req, res, next) {
    // Logic for company details page
    try {
      const connection = req.db;
      const loggedInSellerId = req.session.user ? req.session.user.seller_id : null;

      // const [details] = await connection.execute(`SELECT * FROM seller_profile WHERE seller_id = ?`, [loggedInSellerId]);
      const [id] = await connection.execute(`SELECT * FROM seller_accounts WHERE seller_id = ?`, [loggedInSellerId])
      // res.render('detailscompany.ejs', { emailaddress: id[0].email, details: details })
      res.render('detailscompany.ejs', { emailaddress: id[0].email })

    } catch (error) {
      next(error);
    }

  }

  async sellersGridLayout(req, res, next) {
    try {
      const connection = req.db;
      const loggedInUser = req.session.user;

      if (!loggedInUser) {
        // Redirect or handle the case where the user is not logged in
        return res.redirect('/pages-login');
      }

      let details = [];
      let userType = '';

      if (loggedInUser.buyer_id) {
        userType = 'buyer';
        [details] = await connection.execute(`SELECT * FROM buyer_profile WHERE buyer_id = ?`, [loggedInUser.buyer_id]);
      } else if (loggedInUser.seller_id) {
        userType = 'seller';
        [details] = await connection.execute(`SELECT * FROM seller_profile WHERE seller_id = ?`, [loggedInUser.seller_id]);
      }

      const [freelancers] = await connection.execute(`SELECT * FROM seller_profile`);
      res.render('sellers-grid-layout-full-page.ejs', { freelancers: freelancers, details: details });
    } catch (error) {
      next(error);
    }
  }


  async indexCompany(req, res, next) {
    try {
      const connection = req.db;
      const loggedInSellerId = req.session.user ? req.session.user.seller_id : null;

      if (!loggedInSellerId) {
        // Redirect or handle the case where the seller is not logged in
        return res.redirect('/pages-login');
      }
      const [details] = await connection.execute(`SELECT * FROM seller_profile WHERE seller_id = ?`, [loggedInSellerId]);
      const [freelancer] = await connection.execute('SELECT * FROM seller_profile LIMIT 5');
      const [noofjobs] = await connection.execute('SELECT count(*) as count from products JOIN product_quantity USING(product_id)');
      const [nooffls] = await connection.execute('SELECT count(*) as count from buyer_accounts');
      const [nooftasks] = await connection.execute('SELECT count(*) as count from product_categories');
      const [noofcs] = await connection.execute('SELECT count(*) as count from seller_accounts');
      res.render('index-company.ejs', { details: details, freelancer: freelancer, noofjobs: noofjobs, nooffls: nooffls, nooftasks: nooftasks, noofcs: noofcs })

    } catch (error) {
      next(error);
    }
  }
  async settingCompany(req, res, next) {
    try {
      const connection = req.db;
      const loggedInSellerId = req.session.user ? req.session.user.seller_id : null;

      if (!loggedInSellerId) {
        // Redirect or handle the case where the seller is not logged in
        return res.redirect('/pages-login');
      }

      const [details] = await connection.execute(`SELECT * FROM seller_profile WHERE seller_id = ?`, [loggedInSellerId]);
      const message = req.flash("mess");

      res.render('setting-company.ejs', { details: details, message: message });
    } catch (error) {
      next(error);
    }
  }



  async logoutCompany(req, res, next) {
    // Logic for logging out company account
  }
  async viewSingleCompanyProfile(req, res, next) {
    try {
      const connection = req.db;
      const loggedInSellerId = req.session.user ? req.session.user.seller_id : null;

      if (!loggedInSellerId) {
        // Redirect or handle the case where the seller is not logged in
        return res.redirect('/pages-login');
      }

      const [details] = await connection.execute(`SELECT * FROM seller_profile WHERE seller_id = ?`, [loggedInSellerId]);

      const id = req.params.seller_id;
      const [rows] = await connection.execute(`SELECT * FROM seller_profile WHERE seller_id = ?`, [id]);
      let info = rows[0];

      const [products] = await connection.execute(`
            SELECT p.*, ppt.time_posted, pq.quantity
            FROM products p
            JOIN product_posted_time ppt ON ppt.product_id = p.product_id
            JOIN product_quantity pq ON pq.product_id = p.product_id
            WHERE p.seller_id = ?
        `, [id]);

      res.render('single-company-profile.ejs', {
        info: info,
        details: details,
        products: products,
        calculateDuration: calculateDuration
      });
    } catch (error) {
      next(error);
    }
  }

  async viewCompanyProfile(req, res, next) {
    try {
      const connection = req.db;
      const loggedInSellerId = req.session.user ? req.session.user.seller_id : null;

      if (!loggedInSellerId) {
        // Redirect or handle the case where the seller is not logged in
        return res.redirect('/pages-login');
      }

      const [details] = await connection.execute(`SELECT * FROM seller_profile WHERE seller_id = ?`, [loggedInSellerId]);

      // const [company_id] = await connection.execute('SELECT * from seller_accounts where status=1');
      // const id = company_id[0].seller_id;

      // const [rows] = await connection.execute(`SELECT * FROM seller_profile WHERE seller_id = ?`, [id]);
      let info = details[0];

      res.render('companyprofile.ejs', { info: info, details: details });
    } catch (error) {
      next(error);
    }
  }
  async companyReviews(req, res, next) {
    try {
      const connection = req.db;
      const loggedInSellerId = req.session.user ? req.session.user.seller_id : null;

      if (!loggedInSellerId) {
        // Redirect or handle the case where the seller is not logged in
        return res.redirect('/pages-login');
      }

      const [details] = await connection.execute(`SELECT * FROM seller_profile WHERE seller_id = ?`, [loggedInSellerId]);

      // const [cd] = await connection.execute('SELECT * from seller_accounts where status=1');
      // const cid = cd[0].seller_id;
      const [review] = await connection.execute(`
          SELECT * FROM reviews
          JOIN products USING(product_id)
          WHERE reviews.seller_id = ?
      `, [loggedInSellerId]);

      const [freelancer] = await connection.execute('SELECT * FROM buyer_profile');

      res.render('companyreview.ejs', {
        review: review,
        freelancer: freelancer,
        details: details
      });
    } catch (error) {
      next(error);
    }
  }

  async manageProducts(req, res, next) {
    try {
      const connection = req.db;
      const loggedInSellerId = req.session.user ? req.session.user.seller_id : null;

      if (!loggedInSellerId) {
        // Redirect or handle the case where the seller is not logged in
        return res.redirect('/pages-login');
      }

      const [details] = await connection.execute(`SELECT * FROM seller_profile WHERE seller_id = ?`, [loggedInSellerId]);

      const [rows] = await connection.execute(`
          SELECT p.*, ppt.time_posted, pq.quantity
          FROM products p
          JOIN product_posted_time ppt ON ppt.product_id = p.product_id
          JOIN product_quantity pq ON pq.product_id = p.product_id
          WHERE p.seller_id = "${loggedInSellerId}"
      `);

      let info1 = rows;

      res.render('dashboard-manage-products.ejs', {
        info1: info1,
        calculateDuration: calculateDuration,
        details: details
      });
    } catch (error) {
      next(error);
    }
  }

  async acceptPayment(req, res, next) {
    try {
      const connection = req.db;
      const loggedInSellerId = req.session.user ? req.session.user.seller_id : null;

      if (!loggedInSellerId) {
        // Redirect or handle the case where the seller is not logged in
        return res.redirect('/pages-login');
      }

      const item_id = req.params.item_id;
      await connection.execute(`UPDATE order_items SET order_status="Shipped" WHERE item_id=${item_id}`);
      res.redirect(`/dashboard-manage-orders`);
    } catch (error) {
      next(error);
    }
  }

  async processOrder(req, res, next) {
    try {
      const connection = req.db;
      const loggedInSellerId = req.session.user ? req.session.user.seller_id : null;

      if (!loggedInSellerId) {
        // Redirect or handle the case where the seller is not logged in
        return res.redirect('/pages-login');
      }

      const item_id = req.params.item_id;
      await connection.execute(`UPDATE order_items SET order_status="Shipped" WHERE item_id=${item_id}`);
      res.redirect(`/dashboard-manage-orders`);
    } catch (error) {
      next(error);
    }
  }

  async removeProduct(req, res, next) {
    try {
      const connection = req.db;
      const loggedInSellerId = req.session.user ? req.session.user.seller_id : null;

      if (!loggedInSellerId) {
        // Redirect or handle the case where the seller is not logged in
        return res.redirect('/pages-login');
      }

      const taskid = req.params.id;
      await connection.execute(`DELETE FROM product_posted_time WHERE product_id=${taskid}`);
      await connection.execute(`DELETE FROM product_quantity WHERE product_id=${taskid}`);
      await connection.execute(`DELETE FROM product_tags WHERE product_id=${taskid}`);
      await connection.execute(`DELETE FROM reviews WHERE product_id=${taskid}`);
      res.redirect(`/dashboard-manage-products`);
    } catch (error) {
      next(error);
    }
  }
  async updateProductDetails(req, res, next) {
    try {
      const connection = req.db;
      const loggedInSellerId = req.session.user ? req.session.user.seller_id : null;

      if (!loggedInSellerId) {
        // Redirect or handle the case where the seller is not logged in
        return res.redirect('/pages-login');
      }

      const pass = req.body.productname;
      const pass2 = req.body.category;
      const pass3 = req.body.quantity;
      const pass4 = req.body.min;
      const pass7 = req.body.ptext;
      const pass9 = req.body.skill;
      const values = pass9.split(',');
      const id = req.body.productid;
      let picpath = "";

      try {
        const samplepic = req.files.picture;
        const uploadpathpic = path.join(__dirname, '../public/uploads/', samplepic.name);


        picpath = "/uploads/" + samplepic.name;

        samplepic.mv(uploadpathpic, function (err) {
          if (err) return res.status(500).send(err);
          // else console.log("UPLOADEDDDDDDD")
        });
      } catch (TypeError) {
        picpath = req.body.defaultfile;
      }

      // Fetch logged-in seller's ID
      // const [company_id] = await connection.execute('SELECT * from seller_accounts where status=1');

      // Check if the category already exists in the categories table
      const [existingCategory] = await connection.execute('SELECT category_id FROM product_categories WHERE category_name = ?', [pass2]);

      let categoryId;
      if (existingCategory.length === 0) {
        // If the category doesn't exist, insert it into the categories table
        const query4 = 'INSERT INTO product_categories (category_name) VALUES (?)';
        const [result] = await connection.execute(query4, [pass2]);

        const [category] = await connection.execute('SELECT category_id FROM product_categories WHERE category_name = ?', [pass2]);
        categoryId = category[0].category_id;
      } else {
        // If the category already exists, retrieve the existing category_id
        categoryId = existingCategory[0].category_id;
      }

      const query = `UPDATE products SET category_id="${categoryId}",seller_id="${loggedInSellerId}", product_name="${pass}", price="${pass4}", description="${pass7}", image="${picpath}" WHERE product_id=${id}`;
      await connection.execute(query);
      await connection.execute(`UPDATE product_quantity SET quantity="${pass3}" WHERE product_id=${id}`);
      await connection.execute(`UPDATE product_posted_time SET time_posted=NOW() WHERE product_id=${id}`);

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

      res.redirect("/index-company");
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal server error.');
    }
  }

  async addProduct(req, res, next) {
    try {
      const connection = req.db;

      // Check if the user is logged in via session
      const loggedInSellerId = req.session.user ? req.session.user.seller_id : null;

      if (!loggedInSellerId) {
        // Redirect to the login page if the user is not logged in
        return res.redirect('/login');
      }

      const pass = req.body.projectname;
      const pass2 = req.body.category;
      const pass3 = req.body.quantity;
      const pass4 = req.body.min;
      const pass7 = req.body.ptext;
      const pass8 = req.files.picture;
      const pass9 = req.body.skill;
      const values = pass9.split(',');
      const uploadpathfile = path.join(__dirname, '../public/docs/', pass8.name);

      // const uploadpathfile = __dirname + "../public/docs/" + pass8.name;
      const filepath = "/docs/" + pass8.name;
      pass8.mv(uploadpathfile, function (err) {
        if (err) return res.status(500).send(err);
      });

      // const [company_id] = await connection.execute('SELECT * from seller_accounts where status=1');

      const [existingCategory] = await connection.execute('SELECT category_id FROM product_categories WHERE category_name = ?', [pass2]);
      let categoryId;

      if (existingCategory.length === 0) {
        const query4 = 'INSERT INTO product_categories (category_name) VALUES (?)';
        const [result] = await connection.execute(query4, [pass2]);

        const [category] = await connection.execute('SELECT category_id FROM product_categories WHERE category_name = ?', [pass2]);
        categoryId = category[0].category_id;
      } else {
        categoryId = existingCategory[0].category_id;
      }

      const query = `INSERT INTO products (category_id, seller_id, product_name, price, description, image) VALUES (?, ?, ?, ?, ?, ?)`;
      await connection.execute(query, [categoryId, loggedInSellerId, pass, pass4, pass7, filepath]);

      const [task] = await connection.execute('SELECT * from products order by product_id Desc limit 1 ');
      const query1 = `INSERT INTO product_quantity (product_id, quantity) VALUES (?, ?)`;
      await connection.execute(query1, [task[0].product_id, pass3]);

      const query2 = `INSERT INTO product_posted_time (product_id, time_posted) VALUES (?, NOW())`;
      await connection.execute(query2, [task[0].product_id]);

      for (let i = 0; i < values.length; i++) {
        const tagName = values[i];
        const [existingTag] = await connection.execute('SELECT tag_id FROM tags WHERE tag_name = ?', [tagName]);

        if (existingTag.length === 0) {
          const query2 = 'INSERT INTO tags (tag_name) VALUES (?)';
          await connection.execute(query2, [tagName]);

          const [newTag] = await connection.execute('SELECT tag_id FROM tags WHERE tag_name = ?', [tagName]);
          const query3 = 'INSERT INTO product_tags (product_id, tag_id) VALUES (?, ?)';
          await connection.execute(query3, [task[0].product_id, newTag[0].tag_id]);
        } else {
          const tagId = existingTag[0].tag_id;
          const query3 = 'INSERT INTO product_tags (product_id, tag_id) VALUES (?, ?)';
          await connection.execute(query3, [task[0].product_id, tagId]);
        }
      }

      res.redirect("/index-company");
    } catch (error) {
      next(error);
    }
  }
  async applyFilterSellersGrid(req, res, next) {
    try {
      const connection = req.db;

      // Check if the user is logged in
      const loggedInUser = req.session.user;

      if (!loggedInUser) {
        // Redirect to the login page if the user is not logged in
        return res.redirect('/login');
      }

      let details;
      if (loggedInUser.seller_id) {
        // If the logged-in user is a seller, fetch seller details
        [details] = await connection.execute(`SELECT * FROM seller_profile WHERE seller_id = ?`, [loggedInUser.seller_id]);
      } else if (loggedInUser.buyer_id) {
        // If the logged-in user is a buyer, fetch buyer details
        [details] = await connection.execute(`SELECT * FROM buyer_profile WHERE buyer_id = ?`, [loggedInUser.buyer_id]);
      }

      if (!details || !details[0]) {
        // Handle scenario where details are not found
        return res.redirect('/login'); // Redirect to profile setup or appropriate page
      }

      const location = req.body.location;
      const keywords = req.body.keywords;
      const category = req.body.category;
      const keywordsarray = keywords.split(',');

      let sql = 'SELECT f.* FROM seller_profile f WHERE 1=1';

      if (location) {
        sql += ` AND headquarter LIKE '%${location}%'`;
      }
      if (keywords) {
        for (let i = 0; i < keywordsarray.length; i++) {
          sql += ` AND (companytype LIKE '%${keywords[i]}%' OR intro LIKE '%${keywords[i]}%')`;
        }
      }
      if (category) {
        sql += ` AND companytype LIKE '%${category}%'`;
      }

      const [freelancers] = await connection.execute(sql);

      res.render('sellers-grid-layout-full-page.ejs', { freelancers: freelancers, details: details });
    } catch (error) {
      next(error);
    }
  }

  async updateSellerDetails(req, res, next) {
    // Logic for updating seller details
    try {
      const connection = req.db;

      const cname = req.body.cname
      const email = req.body.email
      const type = req.body.type
      const location = req.body.location
      const describe = req.body.description
      let picpath = ""
      try {
        const samplepic = req.files.picture;

        const uploadpathpic = path.join(__dirname, '../public/uploads/', samplepic.name);

        picpath = "/uploads/" + samplepic.name
        samplepic.mv(uploadpathpic, function (err) {
          if (err) return res.status(500).send(err)
        })

      }
      catch (TypeError) {
        {
          console.log(TypeError);

          picpath = req.body.defaultfile
        }
      }
      const userId = req.session.user.seller_id;


      const query5 = `select * from seller_accounts where seller_id = "${userId}"`
      const [id] = await connection.execute(query5);
      // console.log(req.body)
      if (req.body.cpass && req.body.npass && req.body.rpass) {
        // Compare hashed passwords
        const isPasswordMatch = await bcrypt.compare(req.body.cpass, id[0].password);

        if (isPasswordMatch && req.body.npass === req.body.rpass) {
          // Hash the new password
          const hashedPassword = await bcrypt.hash(req.body.npass, 12);

          // Update the hashed password in the database
          await connection.execute(
            `UPDATE seller_accounts SET password="${hashedPassword}" WHERE seller_id="${id[0].seller_id}"`
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
      // console.log(query)


      await connection.execute(query)
      res.redirect("/index-company")
    } catch (error) {
      next(error);
    }

  }
  async updateDetailsCompany(req, res, next) {
    try {
      const connection = req.db;
      const samplepic = req.files.picture;
      const cname = req.body.cname;
      const email = req.body.email;
      const type = req.body.type;
      const location = req.body.location;
      const describe = req.body.description;
      const uploadpathpic = path.join(__dirname, '../public/uploads/', samplepic.name);


      // const uploadpathpic = __dirname + "/public/uploads/" + samplepic.name;
      const picpath = "/uploads/" + samplepic.name;

      samplepic.mv(uploadpathpic, function (err) {
        if (err) return res.status(500).send(err);
      });

      // Assuming you have stored the user's ID in the session
      const userId = req.session.user.seller_id; // Adjust this based on your session structure

      const query = `
        INSERT INTO seller_profile (seller_id, companyname, email, companytype, intro, image, headquarter)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      await connection.execute(query, [
        userId,
        cname,
        email,
        type,
        describe,
        picpath,
        location,
      ]);

      res.redirect('/index-company');
    } catch (error) {
      next(error);
    }
  }

}

module.exports = new SellerController();
