const onboardService = require('../services/salon-onboarding.service');

exports.init = async (req, res, next) => {
    try {
        const result = await onboardService.init({ body: req.body });
        return res.status(200).json(result);
    } catch (err) {
        console.log('Error in controller onBoardSalon', err);
        return next(err);
    }
};

exports.verify = async (req, res, next) => {
    try {
        const result = await onboardService.verify({ body: req.body });
        return res.status(200).json(result);
    } catch (err) {
        console.log('Error in controller verifyOtp', err);
        return next(err);
    }
};

exports.resend = async (req, res, next) => {
    try {
        const result = await onboardService.resend({ body: req.body });
        return res.status(200).json(result);
    } catch (err) {
        console.log('Error in controller resendOtp', err);
        return next(err);
    }
};
