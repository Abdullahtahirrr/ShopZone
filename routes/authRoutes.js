const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.get('/index-logged-out', authController.getIndexLoggedOut);
router.get('/nomore', authController.noMore);
router.get('/pages-404', authController.pages404);
router.get('/pages-contact', authController.pagesContact);
router.get('/pages-login', authController.pagesLogin);
router.get('/pages-register', authController.pagesRegister);
router.get('/privacy', authController.privacy);
router.get('/termsofuse', authController.termsOfUse);
router.get('/logout/company', authController.logoutCompany);
router.get('/logout/freelancer', authController.logoutFreelancer);

router.post('/pages-register', authController.registerUser);
router.post('/pages-login', authController.loginUser);
router.post('/contact', authController.contactForm);

module.exports = router;
