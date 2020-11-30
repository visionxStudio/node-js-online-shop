const Product = require('../models/product');

exports.getAddProduct = (req, res, next) => {
    res.render('admin/add-product', {
        path: '/admin/add-product',
        pageTitle: 'Add Product',
        editing: false,
        hasError: false,
        errorMessage: null,
        result: '',
        product: {},
        validationErrors: []
    })
}

exports.postAddProduct = (req, res, next) => {
    // extracting the data from the body of req
    const title = req.body.title;
    const brand = req.body.brand;
    const price = req.body.price;
    const stock = req.body.stock;
    const image = req.file;
    const description = req.body.description;
    let cashOnDelivery = req.body.cashOnDelivery;
    const discount = req.body.disPercentage;

    // checking if there is discount 
    if (discount) {
        disPercentage = discount;
    } else {
        disPercentage = 0;
    }

    if (cashOnDelivery == 'on') {
        cashOnDelivery = true;
    } else {
        cashOnDelivery = false;
    }

    console.log(disPercentage);
    console.log(cashOnDelivery);
    if (!image) {
        return res.status(422).render('admin/add-product', {
            pageTitle: 'Add Product',
            path: '/admin/add-product',
            editing: false,
            hasError: true,
            result: 'danger',
            product: {
                title: title,
                brand: brand,
                price: price,
                stock: stock,
                description: description,
                disPercentage: disPercentage,
            },
            errorMessage: 'Attached file is not an image.',
            validationErrors: []
        });
    }

    const imageUrl = image.path;
    const product = new Product({
        title: title,
        brand: brand,
        price: price,
        imageUrl: imageUrl,
        stock: stock,
        description: description,
        cashOnDelivery: cashOnDelivery,
        disPercentage: disPercentage,
        userId: req.user,
    });

    product.save()
        .then(result => {
            console.log('Product Created!')
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });

    res.redirect('/');

};


exports.getAdminPanel = (req, res, next) => {
    res.render('admin/admin-panel', {
        path: 'admin/admin-panel',
        pageTitle: 'Admin Panel',
    })
};