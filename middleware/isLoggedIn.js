module.exports = (req, res, next) => {
    if (req.session.isLoggedIn) {
        return res.status(400).render('404', {
            pageTitle: 'Error!!',
            path: 'error',
            result: 'danger',
            errorMessage: 'You are already logged in!!'
        });
    }
    next();
}