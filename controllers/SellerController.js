// sellerController.js
const { calculateDuration } = require('../config/utils');
const bcrypt = require('bcrypt');

class SellerController {
  
  async manageJobs(req, res, next) {
    try {
      const connection = req.db;
      const [details] = await connection.execute(`SELECT * FROM seller_profile WHERE seller_id=(Select seller_id from seller_accounts where status=1)`);
      const [rows] = await connection.execute(`SELECT * FROM orders JOIN order_items ON orders.order_id = order_items.order_id JOIN products ON order_items.product_id = products.product_id WHERE products.seller_id="${details[0].seller_id}" ORDER BY orders.order_id DESC`);
      res.render('dashboard-manage-jobs.ejs', { orders: rows, details: details });
  } catch (error) {
      next(error);
  }  }

  async updateProduct(req, res,next) {
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
            const [details] = await connection.execute(`SELECT * FROM seller_profile WHERE seller_id=(SELECT seller_id FROM seller_accounts WHERE status=1)`);
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

  async postProduct(req, res,next) {
      // Logic for posting a product (seller)
      try {
        const connection = req.db;
        const [details] = await connection.execute(`SELECT * FROM seller_profile WHERE seller_id=(Select seller_id from seller_accounts where status=1)`);
        res.render('dashboard-post-a-task.ejs', { details });
    } catch (error) {
        next(error);
    }
  }

  async companyDetails(req, res,next) {
      // Logic for company details page
      try {
        const connection = req.db;
        let [details] = await connection.execute(`SELECT * FROM seller_profile WHERE seller_id=(Select seller_id from seller_accounts where status=1)`)

        const [id] = await connection.execute(`SELECT * FROM seller_accounts WHERE status=1`)
        res.render('detailscompany.ejs', { emailaddress: id[0].email, details: details })
    } catch (error) {
        next(error);
    }

  }

  async sellersGridLayout(req, res,next) {
      // Logic for sellers grid layout page
      try {
        const connection=req.db;

        let [details] = await connection.execute(`SELECT * FROM seller_profile WHERE seller_id=(Select seller_id from seller_accounts where status=1)`);
        if (!details[0]) {
          const [buyerDetails] = await connection.execute(`SELECT * FROM buyer_profile WHERE buyer_id = (SELECT buyer_id FROM buyer_accounts WHERE status = 1)`);
          details = buyerDetails.length > 0 ? buyerDetails : [];
        }
        const [freelancers] = await connection.execute(`SELECT * FROM seller_profile`);
        res.render('sellers-grid-layout-full-page.ejs', { freelancers: freelancers, details: details });
      } catch (error) {
        next(error);
      }

  }

  async indexCompany(req, res,next) {
      // Logic for company account's main home screen
      try {
        const connection=req.db;

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
    res.render('index-company.ejs', { details: details, freelancer: freelancer, noofjobs: noofjobs, nooffls: nooffls, nooftasks: nooftasks, noofcs: noofcs })      } catch (error) {
        next(error);
      }
  }

  async settingCompany(req, res,next) {
      // Logic for setting company details
      try {
        const connection=req.db;

        const [id] = await connection.execute(`SELECT seller_id FROM seller_accounts WHERE status=1`)
        const query = `SELECT * FROM seller_profile WHERE seller_id="${id[0].seller_id}"`;
        const [details] = await connection.execute(query);
        const message = req.flash("mess")
    
        res.render('setting-company.ejs', { details: details, message: message })
          } catch (error) {
        next(error);
      }
  }



  async logoutCompany(req, res,next) {
      // Logic for logging out company account
  }

  async viewSingleCompanyProfile(req, res,next) {
      // Logic for viewing a single company profile
      try {
        const connection = req.db;
        const id = req.params.seller_id;
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
        next(error);
      }
  }

  async viewCompanyProfile(req, res,next) {
      // Logic for viewing own company profile
      try {
        const connection = req.db;
        const [company_id] = await connection.execute('SELECT * from seller_accounts where status=1');
        const id = company_id[0].seller_id;
        const [details] = await connection.execute(`SELECT * FROM seller_profile WHERE seller_id=(Select seller_id from seller_accounts where status=1)`)

        const [rows] = await connection.execute(`SELECT * FROM seller_profile WHERE seller_id=${id}`);
        let info = rows[0]
        res.render('companyprofile.ejs', { info: info, details: details })

      } catch (error) {
        next(error);
      }
  }

  async companyReviews(req, res,next) {
      // Logic for viewing company reviews
      try {
        const connection = req.db;
        const [details] = await connection.execute(`SELECT * FROM seller_profile WHERE seller_id=(Select seller_id from seller_accounts where status=1)`)

        const query1 = 'SELECT * from seller_accounts where status=1';
        const [cd] = await connection.execute(query1);
        const cid = cd[0].seller_id;
        const query2 = `SELECT * from reviews JOIN products USING(product_id) where reviews.seller_id="${cid}"`;
        const [review] = await connection.execute(query2);
        const query4 = `SELECT * from buyer_profile`;
        const [freelancer] = await connection.execute(query4);
    
        res.render('companyreview.ejs', { review: review, freelancer: freelancer, details: details });
          } catch (error) {
        next(error);
      }
  }

  async manageTasks(req, res,next) {
      // Logic for managing products (seller)
      try {
        const connection = req.db;
        const [details] = await connection.execute(`SELECT * FROM seller_profile WHERE seller_id=(Select seller_id from seller_accounts where status=1)`)

        const [rows] = await connection.execute(`SELECT p.*, ppt.time_posted, pq.quantity
        FROM products p
        JOIN product_posted_time ppt ON ppt.product_id = p.product_id
        JOIN product_quantity pq ON pq.product_id = p.product_id
        WHERE p.seller_id = (SELECT seller_id FROM seller_accounts WHERE status = 1);
        `)
        let info1 = rows
    
    
        res.render('dashboard-manage-tasks.ejs', { info1: info1, calculateDuration: calculateDuration, details: details })
          } catch (error) {
        next(error);
      }
  }

  async acceptPayment(req, res,next) {
      // Logic for accepting payment (seller)
      try {
        const connection = req.db;
        const item_id = req.params.item_id
    await connection.execute(`UPDATE order_items SET order_status="Shipped" WHERE item_id=${item_id}`)
    res.redirect(`/dashboard-manage-jobs`)
      } catch (error) {
        next(error);
      }
  }

  async processOrder(req, res,next) {
      // Logic for processing an order (seller)
      try {
        const connection=req.db;

        const item_id = req.params.item_id
    await connection.execute(`UPDATE order_items SET order_status="Shipped" WHERE item_id=${item_id}`)
    res.redirect(`/dashboard-manage-jobs`)
      } catch (error) {
        next(error);
      }
  }

  async removeTask(req, res,next) {
    try {
      const connection=req.db;
      const taskid = req.params.id
      await connection.execute(`DELETE FROM product_posted_time WHERE product_id=${taskid}`)
      await connection.execute(`DELETE FROM product_quantity WHERE product_id=${taskid}`)
      await connection.execute(`DELETE FROM product_tags WHERE product_id=${taskid}`)
      await connection.execute(`DELETE FROM reviews WHERE product_id=${taskid}`)
      res.redirect(`/dashboard-manage-tasks`)
  
    } catch (error) {
      next(error);
    }  }

  async updateProductDetails(req, res,next) {
      // Logic for updating product details (seller)
      try {
        const connection=req.db;

        const pass = req.body.productname
        const pass2 = req.body.category
        const pass3 = req.body.quantity
        const pass4 = req.body.min
        const pass7 = req.body.ptext
        const pass9 = req.body.skill
        const values = pass9.split(',')
        const id=req.body.productid;
        let picpath = "";
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
      
        res.redirect("/index-company");
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal server error.');
    }
  }

  async addProduct(req, res,next) {
      // Logic for adding a product (seller)
      try {
        const connection=req.db;

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
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal server error.');
    }
  }

  async applyFilterSellersGrid(req, res,next) {
      // Logic for applying filters on sellers grid page
      try {
        const connection=req.db;

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

        // Render template with filtered data
        res.render('sellers-grid-layout-full-page.ejs', { freelancers: freelancers, details: details });
      } catch (error) {
        next(error);
      }
  }

  async updateSellerDetails(req, res,next) {
      // Logic for updating seller details
      try {
        const connection=req.db;

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
          } catch (error) {
        next(error);
      }

  }

  async updateDetailsCompany(req, res,next) {
      // Logic for updating company details
      try {
        const connection = req.db;
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
    
        
        res.redirect('/index-company');
      } catch (error) {
        next(error);
      }
  }
}

module.exports = new SellerController();
