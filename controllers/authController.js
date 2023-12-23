// authController.js

class AuthController {
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

  async noMore(req, res) {
      // Logic for showing an error page
  }

  async pages404(req, res) {
      // Logic for showing an error page
  }

  async pagesContact(req, res) {
      // Logic for displaying contact details and a form
  }

  async pagesLogin(req, res) {
      // Logic for the login page
  }

  async pagesRegister(req, res) {
      // Logic for the register page
  }

  async privacy(req, res) {
      // Logic for the privacy policy page
  }

  async termsOfUse(req, res) {
      // Logic for the terms of use page
  }

  async registerUser(req, res) {
      // Logic for registering a new account
  }

  async loginUser(req, res) {
      // Logic for handling login details
  }

  async contactForm(req, res) {
      // Logic for handling the contact us form submission
  }

  async logoutCompany(req, res) {
      // Logic for logging out a company account
  }

  async logoutFreelancer(req, res) {
      // Logic for logging out a freelancer account
  }
}

module.exports = new AuthController();
