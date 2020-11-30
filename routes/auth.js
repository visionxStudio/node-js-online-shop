const express = require('express');
const authController = require('../controllers/auth');
const isLoggedIn = require('../middleware/isLoggedIn');

const {
    check,
    body
} = require('express-validator');

const User = require('../models/user');

const router = express.Router();


router.get('/signup', authController.getSignup);

// signing up a user
router.post(
    '/signup', [
        check('email')
        .custom((email, {
            req
        }) => {
            return User.findOne({
                    email: email
                })
                .then(userDoc => {
                    if (userDoc) {
                        return Promise.reject('E-mail Already Exists, please pick a different one!');
                    };
                }) 
        }),
        body('password', 'Please enter a password with at least 6 characters.')
        .isLength({
            min: 6,
            max: 32
        })
        .trim()
        .custom((value, {
            req
        }) => {
            if (value !== req.body.confirmPassword) {
                throw new Error('Passwords have to match!')
            }
            return true;
        })
    ],
    authController.postSignup)

router.get('/login', isLoggedIn,  authController.getLogin);

router.post(
    '/login', [
    body('email'),
    body('password', 'password has to be valid!')
    .isLength({
        min: 6,
        max: 32
    })
    .trim()
], authController.postLogin)


router.get('/logout', authController.postLogout);

router.get('/reset', authController.getReset);

router.post('/reset', authController.postReset);

router.get('/reset/:token', authController.getNewPassword);

router.post('/new-password', authController.postNewPassword);

module.exports = router;