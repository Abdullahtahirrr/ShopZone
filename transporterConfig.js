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

module.exports = transporter;
