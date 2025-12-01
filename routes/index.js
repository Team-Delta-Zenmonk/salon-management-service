const router = require('express').Router();

router.use('/salon', require('./salon.router'));
router.get('/', (req, res, next) => {
    res.send('Salon Management Service is running');
});

module.exports = router;