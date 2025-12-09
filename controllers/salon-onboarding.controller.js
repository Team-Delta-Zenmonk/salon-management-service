const onboardService = require('../services/salon-onboarding.service');

exports.initOnboarding = async (req, res, next) => {
    try {
        const result = await onboardService.initOnboarding({ body: req.body });
        return res.status(200).json(result);
    } catch (err) {
        console.log('Error in controller onBoardSalon', err);
        return next(err);
    }
};

exports.verifyOnboarding = async (req, res, next) => {
    try {
        const result = await onboardService.verifyOnboarding({ body: req.body });
        res.cookie('jwt', result.token, { httpOnly: true, secure: true, maxAge: 36000000, sameSite: 'none' });
        return res.status(200).json(result);
    } catch (err) {
        console.log('Error in controller verifyOtp', err);
        return next(err);
    }
};

exports.resendOtp = async (req, res, next) => {
    try {
        const result = await onboardService.resendOtp({ body: req.body });
        return res.status(200).json(result);
    } catch (err) {
        console.log('Error in controller resendOtp', err);
        return next(err);
    }
};
