const express = require('express');
const router = express.Router();
const BuyerController = require('../controllers/BuyerController');

router.get('/browse-companies', BuyerController.browseCompanies);
router.get('/dashboard-my-active-cart', BuyerController.viewCart);
router.get('/removecartitem/:cart_id/:product_id', BuyerController.removeCartItem);
router.get('/myorders', BuyerController.viewAllOrders);
router.get('/vieworderdetails/:order_id', BuyerController.viewOrderDetails);
router.get('/dashboard-settings', BuyerController.dashboardSettings);
router.get('/detailsfreelancer', BuyerController.buyerDetails);
router.get('/index', BuyerController.mainHomeScreen);
router.get('/products-grid-layout-full-page', BuyerController.productsGridLayout);

// router.get('/logout/freelancer', BuyerController.logoutBuyer);W
router.get('/addcart/:product_id', BuyerController.openProductPage);
router.get('/browsecompanyfreelancer', BuyerController.browseCompanyFreelancer);
router.get('/singlecompanypagefreelancer/:seller_id', BuyerController.viewSingleCompanyPageFreelancer);
router.get('/dashboard-reviews', BuyerController.viewBuyerReviews);
router.get('/single-freelancer-profile/', BuyerController.viewBuyerProfile);
router.get('/receive-order/:item_id', BuyerController.setOrderReceived);
router.get('/markasdelivered/:item_id', BuyerController.markAsDelivered);

router.post('/updatecart', BuyerController.updateCart);
router.post('/confirmorder', BuyerController.confirmOrder);
router.post('/dashboard-settings', BuyerController.updateBuyerDetails);
router.post('/detailsfreelancer', BuyerController.addBuyerDetails);
router.post('/products-grid-layout-full-page', BuyerController.applyFilterProductSearch);
router.post('/done', BuyerController.addProductToCart);
router.post('/giveproductreview', BuyerController.giveProductReview);

module.exports = router;
