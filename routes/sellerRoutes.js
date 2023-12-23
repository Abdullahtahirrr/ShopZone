const express = require('express');
const router = express.Router();
const sellerController = require('../controllers/sellerController');

router.get('/dashboard-manage-jobs', sellerController.manageJobs);
router.get('/updateproduct/:product_id', sellerController.updateProduct);
router.get('/dashboard-post-a-task', sellerController.postProduct);
router.get('/detailscompany', sellerController.companyDetails);
router.get('/sellers-grid-layout-full-page', sellerController.sellersGridLayout);
router.get('/index-company', sellerController.indexCompany);
router.get('/setting-company', sellerController.settingCompany);
router.get('/tasks-grid-layout-full-page', sellerController.tasksGridLayout);
router.get('/logout/company', sellerController.logoutCompany);
router.get('/single-company-profile/:seller_id', sellerController.viewSingleCompanyProfile);
router.get('/companyprofile', sellerController.viewCompanyProfile);
router.get('/companyreviews', sellerController.companyReviews);
router.get('/dashboard-manage-tasks', sellerController.manageTasks);
router.get('/acceptpayment/:item_id', sellerController.acceptPayment);
router.get('/processorder/:item_id', sellerController.processOrder);
router.get('/removetask/:id', sellerController.removeTask);

router.post('/updateproduct', sellerController.updateProductDetails);
router.post('/dashboard-post-a-task', sellerController.addProduct);
router.post('/sellers-grid-layout-full-page', sellerController.applyFilterSellersGrid);
router.post('/setting-company', sellerController.updateSellerDetails);
router.post('/detailscompany', sellerController.updateDetailsCompany);

module.exports = router;

