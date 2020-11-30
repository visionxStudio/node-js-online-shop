const express = require('express');

const adminController = require('../controllers/admin');
const isAuth = require('../middleware/is-auth');

const {
    check,
    body
} = require('express-validator');

const User = require('../models/user');

const router = express.Router();


router.get('/add-product', isAuth, adminController.getAddProduct);

router.post('/add-product', isAuth, adminController.postAddProduct);

router.get('/admin-panel', isAuth, adminController.getAdminPanel);

module.exports = router;