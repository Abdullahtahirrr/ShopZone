const express = require('express');
const router = express.Router();
const sellerController = require('../controllers/SellerController');

router.get('/dashboard-manage-orders', sellerController.manageOrders);
router.get('/updateproduct/:product_id', sellerController.updateProduct);
router.get('/dashboard-post-a-products', sellerController.postProduct);
router.get('/detailscompany', sellerController.companyDetails);
router.get('/sellers-grid-layout-full-page', sellerController.sellersGridLayout);
router.get('/index-company', sellerController.indexCompany);
router.get('/setting-company', sellerController.settingCompany);
router.get('/logout/company', sellerController.logoutCompany);
router.get('/single-company-profile/:seller_id', sellerController.viewSingleCompanyProfile);
router.get('/companyprofile', sellerController.viewCompanyProfile);
router.get('/companyreviews', sellerController.companyReviews);
router.get('/dashboard-manage-products', sellerController.manageProducts);
router.get('/acceptpayment/:item_id', sellerController.acceptPayment);
router.get('/processorder/:item_id', sellerController.processOrder);
router.get('/removeproduct/:id', sellerController.removeProduct);

router.post('/updateproduct', sellerController.updateProductDetails);
router.post('/dashboard-post-a-products', sellerController.addProduct);
router.post('/sellers-grid-layout-full-page', sellerController.applyFilterSellersGrid);
router.post('/setting-company', sellerController.updateSellerDetails);
router.post('/detailscompany', sellerController.updateDetailsCompany);

module.exports = router;

