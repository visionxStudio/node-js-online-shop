// handeling the 500 bad request
exports.get500 = (req, res, next) => {
    res.status(500).render('500', {
        pageTitle: 'Error!',
        path: 'error',
        result: 'danger',
        errorMessage: '',
    });
};
// handeling the 400 bad request
exports.get400 = (req, res, next) => {
    res.status(400).render('400', {
        pageTitle: 'Error!',
        path: 'error',
        result: 'danger',
        errorMessage: '',
    });
};