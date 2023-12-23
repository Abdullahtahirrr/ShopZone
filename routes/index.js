
// navigationController.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const productController = require('../controllers/productController');
const orderController = require('../controllers/orderController');

// Authentication Routes
router.post('/register', authController.registerUser);
// Add other authentication routes as needed
router.get('/index-logged-out', authController.getIndexLoggedOut);

// Product Routes
router.get('/browse-companies', productController.browseCompanies);
router.get('/dashboard-manage-jobs', productController.manageJobs);
// Add other product-related routes as needed

// Order Routes
router.get('/dashboard-my-active-bids', orderController.activeBids);
router.get('/removecartitem/:cart_id/:product_id', orderController.removeCartItem);
router.post('/updatecart', orderController.updateCart);
router.post('/confirmorder', orderController.confirmOrder);
// Add other order-related routes as needed

module.exports = router;
