const { staffServiceController } = require('../controllers');
const { validate } = require('../middlewares/validate.middleware');
const router = require('express').Router();

router.post('/', validate(), staffServiceController.bulkCreate);

module.exports = router;
