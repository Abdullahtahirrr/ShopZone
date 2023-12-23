const express = require('express');
const router = express.Router();
const sellerController = require('../controllers/SellerController');

router.get('/dashboard-manage-jobs', sellerController.dashboardManageJobs);
router.get('/updateproduct/:product_id', sellerController.updateProductPage);
router.get('/dashboard-post-a-task', sellerController.postProduct);
router.get('/companyprofile', sellerController.companyProfile);

// ... Add other seller-related routes

module.exports = router;
