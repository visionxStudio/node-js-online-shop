const bcrypt = require('bcrypt');
const {
    validationResult
} = require('express-validator');

const crypto = require('crypto');

const User = require('../models/user');

// setting up the email service from the sendgrip
const sendgrip = require('@sendgrid/mail');
sendgrip.setApiKey(process.env.SENDGRID_API_KEY);


exports.getSignup = (req, res, next) => {
    let message = req.flash('error');
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    res.render('auth/signup', {
        pageTitle: 'Sign Up now for Free!',
        errorMessage: message,
        path: '/signup',
        result: '',
        oldInput: {
            firstname: '',
            lastname: '',
            email: '',
            password: '',
        },
        validationErrors: []
    })
};


exports.postSignup = (req, res, next) => {
    const firstname = req.body.firstname;
    const lastname = req.body.lastname;
    const email = req.body.email;
    const password = req.body.password;

    // checking for the possible errors
    const errors = validationResult(req); // passing the req argument because routes errors are stored in req
    if (!errors.isEmpty()) {
        return res.status(422).render('auth/signup', {
            pageTitle: 'Sign Up now for Free!',
            path: '/signup',
            errorMessage: errors.array()[0].msg,
            result: 'danger',
            oldInput: {
                firstname: firstname,
                lastname: lastname,
                email: email,
                password: password,
            },
            validationErrors: errors.array()
        })
    }

    // if the above code success then only the new user will be created!
    bcrypt.hash(password, 12)
        .then(hashedPassword => {
            const user = new User({
                firstname: firstname,
                lastname: lastname,
                email: email,
                password: hashedPassword,
                cart: {
                    items: []
                }
            });
            return user.save()
                .then(result => {
                    const msg = {
                        to: email,
                        from: 'manish.rajak2055@gmail.com',
                        subject: 'SignUp Successful!',
                        html: '<h1>You successfully signed up!</h1>',
                    };
                    return sendgrip.send(msg)
                        .then(success => {
                            if (success) {
                                return res.status(200).render('auth/signup', {
                                    pageTitle: 'Sign Up now for Free!',
                                    path: '/signup',
                                    errorMessage: 'You have Successfully signed up!.',
                                    result: 'success',
                                    oldInput: {
                                        firstname: '',
                                        lastname: '',
                                        email: '',
                                        password: '',
                                    },
                                    validationErrors: errors.array()
                                })
                            } else {
                                return res.status(422).render('auth/signup', {
                                    pageTitle: 'Sign Up now for Free!',
                                    path: '/signup',
                                    errorMessage: 'opps!! Something Went Wrong!! Try Again Later!',
                                    result: 'danger',
                                    oldInput: {
                                        firstname: firstname,
                                        lastname: lastname,
                                        email: email,
                                        password: password,
                                    },
                                    validationErrors: errors.array()
                                })
                            }
                        })
                        .catch(err => {
                            // throw new Error('Email cannot be sent')
                            return res.status(422).render('auth/signup', {
                                pageTitle: 'Sign Up now for Free!',
                                path: '/signup',
                                errorMessage: 'opps!! Something Went Wrong!! Try Again Later!',
                                result: 'danger',
                                oldInput: {
                                    firstname: firstname,
                                    lastname: lastname,
                                    email: email,
                                    password: password,
                                },
                                validationErrors: errors.array()
                            })
                        })
                })
                .catch(err => {
                    console.log(err);
                })
        })
        .catch()
};

exports.getLogin = (req, res, next) => {
    let message = req.flash('error');
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    res.render('auth/login', {
        pageTitle: 'Login to your account',
        path: '/login',
        errorMessage: message,
        result: '',
        oldInput: {
            email: '',
            password: ''
        },
        validationErrors: []
    })
};


exports.postLogin = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).render('auth/login', {
            pageTitle: 'Login to your account',
            path: '/login',
            errorMessage: errors.array()[0].msg,
            result: 'danger',
            oldInput: {
                email: email,
                password: password
            },
            validationErrors: errors.array()
        });
    }

    User.findOne({
            email: email
        })
        .then(user => {
            if (!user) {
                return res.status(422).render('auth/login', {
                    pageTitle: 'Login to your account',
                    path: '/login',
                    errorMessage: 'Invalid email or Password',
                    result: 'danger',
                    oldInput: {
                        email: email,
                        password: password
                    },
                    validationErrors: errors.array()
                });
            }

            bcrypt.compare(password, user.password)
                .then(doMatch => {
                    if (!doMatch) {
                        return res.status(422).render('auth/login', {
                            pageTitle: 'Login to your account',
                            path: '/login',
                            errorMessage: 'Invalid email or Password',
                            result: 'danger',
                            oldInput: {
                                email: email,
                                password: password
                            },
                            validationErrors: errors.array()
                        });
                    } else {
                        req.session.isLoggedIn = true;
                        req.session.user = user;
                        return req.session.save(err => {
                            // console.log(err);
                            console.log('login Success!');
                            res.redirect('/');
                        });
                    }
                }).catch(err => {
                    console.log(err);
                    res.redirect('/login');
                })
        })
        .catch();
};

exports.postLogout = (req, res, next) => {
    req.session.destroy(err => {
        if(err) {
            console.log(err);
        }
        res.redirect('/');
    });
};


exports.getReset = (req, res, next) => {
    let message = req.flash('error');
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    res.render('auth/reset', {
        pageTitle: 'Reset Your Password',
        path: '/reset',
        errorMessage: message,
        result: 'danger',
        oldInput: {
            email: '',
        },
        validationErrors: []
    })
};

exports.postReset = (req, res, next) => {
    crypto.randomBytes(32, (err, buffer) => {
        if (err) {
            console.log(err);
            return res.redirect('/');
        }
        token = buffer.toString('hex');
        User.findOne({
                email: req.body.email
            })
            .then(user => {
                if (!user) {
                    req.flash('error', 'No User is associated with that E-mail!')
                    return res.status(422).redirect('/reset');
                }
                user.resetToken = token;
                user.resetTokenExpiration = Date.now() + 300000;
                return user.save()
                    .then(result => {
                        const msg = {
                            to: req.body.email,
                            from: 'manish.rajak2055@gmail.com',
                            subject: 'Password Reset',
                            html: `
                          <p>You requested a password reset</p>
                          <p><strong>Click the link below to Reset your Password</strong></p>
                          <p><a href="http://localhost:3000/reset/${token}">CLICK HERE!</p>
                        `
                        };
                        return sendgrip.send(msg)
                            .then(success => {
                                if (success) {
                                    res.status(200).render('auth/reset', {
                                        pageTitle: 'Reset Your Password',
                                        path: '/reset',
                                        errorMessage: `Reset Email has been sent to ${req.body.email}`,
                                        result: 'success',
                                        oldInput: {
                                            email: '',
                                        },
                                        validationErrors: []
                                    })
                                } else {
                                    res.status(200).render('auth/reset', {
                                        pageTitle: 'Reset Your Password',
                                        path: '/reset',
                                        errorMessage: `Sorry! Something Went Wrong!! Try Again Later!!`,
                                        result: 'danger',
                                        oldInput: {
                                            email: '',
                                        },
                                        validationErrors: []
                                    })
                                }
                            })
                            .catch(err => {
                                console.log('error While Sending reset email');
                                console.log(err);
                            });
                    }).catch(err => {
                        console.log(err);
                    })
            })
            .catch(err => {
                console.log('error While Sending reset email');
                console.log(err);
            });
    });
};

exports.getNewPassword = (req, res, next) => {
    const token = req.params.token;
    User.findOne({
            resetToken: token,
            resetTokenExpiration: {
                $gt: Date.now()
            }
        })
        .then(user => {
            if (!user) {
                return res.status(404).render('auth/new-password', {
                    pageTitle: 'Reset Your Password',
                    path: '/reset',
                    errorMessage: `Something Went Wrong. Redirecting to the login page`,
                    result: 'danger',
                    hidden: true,
                    userId: '',
                    passwordToken: '',
                    oldInput: {
                        newPassword: '',
                    },
                    validationErrors: []
                });
            } else {
                return res.render('auth/new-password', {
                    pageTitle: 'Reset Your Password',
                    path: '/reset',
                    errorMessage: `Enter your new password to continue!`,
                    result: 'info',
                    hidden: false,
                    userId: user._id.toString(),
                    passwordToken: token,
                    oldInput: {
                        newPassword: '',
                    },
                    validationErrors: []
                });
            }
        })
};

exports.postNewPassword = (req, res, next) => {
    const newPassword = req.body.newPassword;
    const userId = req.body.userId;
    const passwordToken = req.body.passwordToken;
    let resetUser;
    User.findOne({
            _id: userId,
            resetToken: passwordToken,
            resetTokenExpiration: {
                $gt: Date.now()
            }
        })
        .then(user => {
            resetUser = user;
            if (!user) {
                return res.status(404).render('auth/new-password', {
                    pageTitle: 'Reset Your Password',
                    path: '/reset',
                    errorMessage: `Something Went Wrong. Please Try Again Later!`,
                    result: 'danger',
                    hidden: true,
                    userId: '',
                    passwordToken: '',
                    oldInput: {
                        newPassword: '',
                    },
                    validationErrors: []
                });
            } else {
                bcrypt.hash(newPassword, 12)
                    .then(hashedPassword => {
                        resetUser.password = hashedPassword;
                        resetUser.resetToken = undefined;
                        resetUser.resetTokenExpiration = undefined;
                        return resetUser.save()
                        .then(success => {
                            return res.render('auth/login', {
                                pageTitle: 'Login to your account',
                                path: '/login',
                                errorMessage: "Password changed successfully! Login Now.",
                                result: 'success',
                                oldInput: {
                                    email: '',
                                    password: ''
                                },
                                validationErrors: []
                            })
                        })
                        .catch(err => {
                            console.log(err);
                        });
                    })
                    .catch(err => {
                        console.log(err);
                    });
            }
        })
        .catch(err => {
            console.log(err);
        });
};