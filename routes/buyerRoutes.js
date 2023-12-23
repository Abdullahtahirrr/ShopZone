const express = require('express');
const router = express.Router();
const buyerController = require('../controllers/BuyerController');

router.get('/browse-companies', buyerController.browseCompanies);
router.get('/dashboard-my-active-bids', buyerController.viewCart);
router.get('/myactivejobs', buyerController.myActiveJobs);
router.get('/vieworderdetails/:order_id', buyerController.viewOrderDetails);
router.get('/removecartitem/:cart_id/:product_id', buyerController.removeCartItem);

// ... Add other buyer-related routes

module.exports = router;
