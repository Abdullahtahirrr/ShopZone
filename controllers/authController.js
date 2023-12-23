// authController.js
const bcrypt = require('bcrypt');
// const db  = require('../dbConfig');
// const connection =  db();
const nodemailer = require('nodemailer');
// const { connect } = require('../routes');
const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: 'prolancerwebsite@gmail.com',
    pass: 'yvzumfmaehebazwt',
  },
});

class AuthController {
  async registerUser(req, res) {
    // Implement user registration logic here
  }

  async getIndexLoggedOut(req, res) {
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
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  }
}

module.exports = new AuthController();
