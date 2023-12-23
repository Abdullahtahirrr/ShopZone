const express = require('express');
const router = express.Router();
const authController = require('../controllers/AuthController');

router.get('/logout/company', authController.logoutCompany);
router.get('/logout/freelancer', authController.logoutFreelancer);

// ... Add other authentication-related routes

module.exports = router;
