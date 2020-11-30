// importing the required library
const express = require('express');
const chalk = require('chalk');
const bodyParser = require('body-parser')
const mongoose = require('mongoose');
const path = require('path');
const multer = require('multer');
const csrf = require('csurf');
const flash = require('connect-flash');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const ms = require('ms');
const User = require('./models/user');

const errorController = require('./controllers/error');

const MONGODB_URI = 'mongodb+srv://manish:iamvisionx123@test-42wxh.mongodb.net/techsansaar';

const app = express();

// initializing the session store to store session in the database
const store = new MongoDBStore({
    uri: MONGODB_URI,
    collection: 'sessions' // this will store the sessions in the session collection in the database
})

// initializing the csrf protection
const csrfProtection = csrf(); 

// specifying the filestorage for the uploaded images
const fileStorage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'images')
    },
    filename: function(req, file, cb) {
        cb(null, new Date().toISOString()+ '-' + file.originalname);  
    }
});

// filtering by mimeTypes
const fileFilter = (req, file, cb) => {
    if((file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg')) {
        cb(null, true);
    } else {
        cb(null, false);
    }
}

// setting up the view engine
// install the ejs by using the npm install --save ejs
app.set('view engine', 'ejs');
// setting up the view path
app.set('views', 'views');


// ROUTES
const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');

// setting up the body parser
app.use(bodyParser.urlencoded({
    extended: false
}));

// setting up the multer parser
app.use(multer({
    storage: fileStorage,
    fileFilter: fileFilter
  }).single('image')); // storing the single image

// defining the static path for css and js
app.use(express.static(path.join(__dirname, 'public')));

/*
Here we are specifying that the /image is for the url and images is for directory
*/

app.use('/images', express.static(path.join(__dirname, 'images')));

app.use(session({
    secret: 'my secret',
    resave: false,
    saveUninitialized: false,
    store: store,
    cookie: {
        maxAge: ms('14 days') // `ms` is a node module to convert string into milliseconds
    },
}));

app.use(csrfProtection);

app.use(flash());   // req.flash requires the session

app.use((req, res, next) => {
    if (!req.session.user) {
      return next();
    }
    User.findById(req.session.user._id)
      .then(user => {
        if (!user) {
          return next();
        }
        req.user = user;
        next();
      })
      .catch(err => {
        throw new Error(err);
      });
  });

// storing isAuthenticated and csrfToken in locals and use this before the routes
app.use((req, res, next) => {
    res.locals.isAuthenticated = req.session.isLoggedIn; // res.locals stores the data and nakes it available in the views
    res.locals.csrfToken = req.csrfToken();
    next();
  });


// using the routes
app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

// Handling the bad get requests
app.get('/500', errorController.get500); // handling the 500 bad request

app.use((req, res, next ) => {
    const url = req.url;
    const hostname = req.hostname;
    res.status(400).render('404', {
        pageTitle: 'Error!!',
        path: 'error',
        result: 'danger',
        errorMessage: `We are sorry but the page you requested was not found`
    });
}); // handling the 400 bad request


// setting up the database
mongoose.connect(MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    }, err => {
        if (err) {
            console.log(chalk.inverse.red(err));
        } else {
            console.log(chalk.greenBright.inverse.bold('We are connected!'))
        }
    })
    .then(() => {
        app.listen(3000);
        console.log('Listening to localhost:3000')
    })
    .catch(err => {
        console.log('error at mongoose connect!');
        console.log(err);
    });