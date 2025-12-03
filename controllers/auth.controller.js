const { authService } = require("../services");

exports.loginSalon = async (req, res, next) => {
    try {
        const response = await authService.loginSalon({ body: req.body });
        res.cookie('jwt', response.token, { httpOnly: true, secure: true, maxAge: 36000000, sameSite: 'none' });
        return res.status(200).json(response);

    } catch (error) {
        console.log("Error in controller loginSalon", error);
        return next(error);
    }
}