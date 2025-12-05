const { staffService } = require('../services');

module.exports = {
    salonController: require('./salon.controller'),
    salonOnboardingController: require('./salon-onboarding.controller'),
    authController: require('./auth.controller'),
    categoryController: require('./category.controller'),
    staffController: require('./staff.controller'),
    serviceController: require('./service.controller'),
    staffServiceController: require('./staff-service.controller')
}