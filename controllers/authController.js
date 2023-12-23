// authController.js
const bcrypt = require('bcrypt');

class AuthController {

  async getIndexLoggedOut(req, res,next) {
    try {
      const connection= req.db;
      const query1 = 'SELECT * FROM seller_profile LIMIT 5';
      const query2 = `SELECT p.*,sp.headquarter
        FROM products p
        JOIN seller_profile sp ON sp.seller_id = p.seller_id LIMIT 5`;
      const query3 = 'SELECT count(*) as count from product_categories';
      const query4 = 'SELECT count(*) as count from products JOIN product_quantity USING(product_id)';
      const query5 = 'SELECT count(*) as count from buyer_accounts';
      const query6 = 'SELECT count(*) as count from seller_accounts';

      const [freelancer] = await connection.execute(query1);
      const [jobs] = await connection.execute(query2);
      const [noofjobs] = await connection.execute(query4);
      const [nooffls] = await connection.execute(query5);
      const [nooftasks] = await connection.execute(query3);
      const [noofcs] = await connection.execute(query6);
      console.log("HERE")

      res.render('index-logged-out.ejs', {
        freelancer: freelancer,
        jobs: jobs,
        noofjobs: noofjobs,
        nooffls: nooffls,
        nooftasks: nooftasks,
        noofcs: noofcs,
      });
    } catch (error) {
      // console.error(error);
      // res.status(500).send('Internal Server Error');
      next(error);
    }
  }

  async noMore(req, res,next) {
    try {
      res.render('nomore.ejs')
    } catch (error) {
      next(error);
    }
  }

  async pages404(req, res,next) {
    try {
      res.render('pages-404.ejs')
    } catch (error) {
      next(error);
    }
}

  async pagesContact(req, res,next) {
      // Logic for displaying contact details and a form
      try {
        res.render('pages-contact.ejs')
      } catch (error) {
        next(error);
      }
  }

  async pagesLogin(req, res,next) {
      // Logic for the login page
      try {
        const message = req.flash("mess")
        res.render('pages-login', { message })
          } catch (error) {
        next(error);
      }
  }

  async pagesRegister(req, res,next) {
      // Logic for the register page
      try {
        const message = req.flash("mess")
    res.render('pages-register.ejs', { message })
      } catch (error) {
        next(error);
      }
      
  }

  async privacy(req, res,next) {
      // Logic for the privacy policy page
      try {
        res.render('privacy.ejs')
      } catch (error) {
        next(error);
      }
  }

  async termsOfUse(req, res,next) {
      // Logic for the terms of use page
      try {
        res.render('termsofuse.ejs')
      } catch (error) {
        next(error);
      }
  }

  async registerUser(req, res,next) {
      // Logic for registering a new account
      try {
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
        }      } catch (error) {
        next(error);
      }
  }

  async loginUser(req, res,next) {
      // Logic for handling login details
      try {
        const connection = req.db;
        const email = req.body.emailaddress;
    // const hash = await bcrypt.hash(req.body.password, 12);
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

  }catch(error){
    next(error);
  }}



  async contactForm(req, res,next) {
      // Logic for handling the contact us form submission
      try {
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
    })
      } catch (error) {
        next(error);
      }
  }

  async logoutCompany(req, res,next) {
      // Logic for logging out a company account
      try {
        req.session.destroy();

        res.redirect('/pages-login');
          } catch (error) {
        next(error);
      }
  }

  async logoutFreelancer(req, res,next) {
      // Logic for logging out a freelancer account
      try {
        req.session.destroy();

        res.redirect('/pages-login');
          } catch (error) {
        next(error);
      }
  }
}

module.exports = new AuthController();
