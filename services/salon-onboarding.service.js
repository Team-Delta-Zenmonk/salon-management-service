const { error } = require('../libs'); // your error helper
const { salonRepository, salonOnboardingRepository } = require("../repository");
const mailService = require('./mail.service');
const { hashPassword } = require('../libs/hash');
const { generateOtp, now, addMinutes } = require('../libs/otp');

const OTP_TTL_MINUTES = parseInt(process.env.OTP_TTL_MINUTES || '5');
const OTP_LENGTH = parseInt(process.env.OTP_LENGTH || '6');
const RESEND_MAX_PER_HOUR = parseInt(process.env.OTP_RESEND_MAX_PER_HOUR || '3');

exports.init = async (payload) => {
    const { email, name, password } = payload.body;
    if (!email || !name || !password) {
        throw new error.BadRequest('All fields required');
    }

    //If fully registered already
    const existing = await salonRepository.findOne({ email });
    if (existing) {
        throw new error.BadRequest('Email already registered. Please login.');
    }

    //check onboarding entry
    let onboarding = await salonOnboardingRepository.findOne({ email });

    const nowTime = now();

    //If entry exists and OTP is still valid -> tell user to use existing OTP
    if (onboarding && onboarding.otp_expires_at && new Date(onboarding.otp_expires_at) > nowTime) {
        return { message: 'OTP already sent. Please check your email.' };
    }

    // Generate new OTP
    const otp = generateOtp(OTP_LENGTH);
    const otpCreatedAt = nowTime;
    const otpExpiresAt = addMinutes(otpCreatedAt, OTP_TTL_MINUTES);
    const hashedPassword = await hashPassword(password);

    if (!onboarding) {
        onboarding = await salonOnboardingRepository.create({
            email,
            name,
            password: hashedPassword,
            otp,
            otp_created_at: otpCreatedAt,
            otp_expires_at: otpExpiresAt,
            resend_count_hour: 0,
            last_resend_at: nowTime,
        });
    } else {
        // update existing onboarding
        onboarding = await salonOnboardingRepository.update({
            payload: {
                otp,
                otp_created_at: otpCreatedAt,
                otp_expires_at: otpExpiresAt,
                password: hashedPassword,
            },
            criteria: { email }
        });
    }

    // send email
    await mailService.sendMailToUser(email, 'Your verification code', `Your OTP is ${otp}. It expires in ${OTP_TTL_MINUTES} minutes.`);

    return { message: 'OTP sent to your email', email };
};

exports.verify = async (payload) => {
    const { email, otp } = payload.body;
    if (!email || !otp) throw new error.BadRequest('Email and OTP required');

    const record = await salonOnboardingRepository.findOne({ email });
    if (!record) throw new error.BadRequest('No onboarding found for this email. Please register first.');

    const nowTime = now();

    if (!record.otp || String(record.otp) !== String(otp)) {
        throw new error.BadRequest('Invalid OTP');
    }

    if (new Date(record.otp_expires_at) < nowTime) {
        throw new error.BadRequest('OTP expired. Please request resend.');
    }

    // create salon
    await salonRepository.create({
        email: record.email,
        name: record.name,
        password: record.password,
    });

    // delete onboarding entry
    await salonOnboardingRepository.softDelete({ email });

    // optionally send welcome mail
    await mailService.sendMailToUser(email, 'Welcome to Salon', 'Your account is ready. You can login now.');

    return { message: 'OTP verified. Salon created.' };
};

exports.resend = async (payload) => {
    const { email } = payload.body;
    if (!email) throw new error.BadRequest('Email required');

    const record = await salonOnboardingRepository.findOne({ email });
    if (!record) throw new error.BadRequest('No onboarding found. Please register first.');

    const nowTime = now();

    // reset hourly counter when last_resend_at older than 1 hour
    if (!record.last_resend_at || (nowTime - new Date(record.last_resend_at) > 60 * 60 * 1000)) {
        await salonOnboardingRepository.update({
            payload: { resend_count_hour: 0 },
            criteria: { email }
        });
        record.resend_count_hour = 0;
    }

    if (record.resend_count_hour >= RESEND_MAX_PER_HOUR) {
        throw new error.BadRequest('Resend limit reached. Try again later.');
    }

    // If existing OTP still valid, disallow immediate resend (optional)
    if (new Date(record.otp_expires_at) > nowTime) {
        // you can choose to allow resending same OTP; we send a message instead
        return { message: 'Your OTP is still valid. Please check your email.' };
    }

    // generate new otp, update counts
    const otp = generateOtp(OTP_LENGTH);
    const otpExpiresAt = addMinutes(nowTime, parseInt(process.env.OTP_TTL_MINUTES || '5'));

    await salonOnboardingRepository.update({
        payload: {
            otp,
            otp_created_at: nowTime,
            otp_expires_at: otpExpiresAt,
            resend_count_hour: (record.resend_count_hour || 0) + 1,
            last_resend_at: nowTime,
        },
        criteria: { email }
    });

    await mailService.sendMailToUser(email, 'Your new verification code', `Your new OTP is ${otp}. It expires in ${process.env.OTP_TTL_MINUTES || '5'} minutes.`);

    return { message: 'OTP resent successfully.' };
};
