const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const Joi = require('joi');
const jwt = require('jsonwebtoken');
const crypto = require('crypto'); // For generating random codes
const sendEmail = require('../services/emailService');

const prisma = new PrismaClient();

// Helper: Generate 6-digit code
const generateVerificationCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// 1. REGISTER
const register = async (req, res, next) => {
    try {
        const schema = Joi.object({
            email: Joi.string().email().required(),
            password: Joi.string().min(6).required()
        });

        const { error } = schema.validate(req.body);
        if (error) return res.status(400).json({ message: error.details[0].message });

        const { email, password } = req.body;

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) return res.status(400).json({ message: 'Email already in use' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Generate Verification Token
        const verificationToken = generateVerificationCode();

        const newUser = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                verificationToken,
                isVerified: false // Default is false
            }
        });

        // Send Real Email
        await sendEmail(email, 'Verify Your Email', 'verification', { code: verificationToken });

        // Keep logging for dev purposes just in case
        console.log(`📧 [MOCK EMAIL] To: ${email} | Code: ${verificationToken}`);

        res.status(201).json({
            message: 'User registered. Please check your email for verification code.',
            userId: newUser.id,
            // Dev only: returning token to make testing easier until email service is up
            debugToken: verificationToken
        });

    } catch (error) {
        next(error);
    }
};

// 2. LOGIN
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // 1. Find User
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // 2. Check Lockout
        if (user.lockUntil && user.lockUntil > new Date()) {
            const remainingTime = Math.ceil((user.lockUntil - new Date()) / 1000);
            return res.status(429).json({
                message: `Account locked.Try again in ${remainingTime} seconds.`
            });
        }

        // 3. Check Password
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            // Increment failed attempts
            const attempts = user.failedLoginAttempts + 1;
            let lockUntil = null;
            let updateData = { failedLoginAttempts: attempts };

            // Lockout Logic: 3 attempts -> 1 minute lock
            if (attempts >= 3) {
                lockUntil = new Date(Date.now() + 1 * 60 * 1000); // 1 minute
                updateData.lockUntil = lockUntil;
                // Optional: Reset attempts after lock? Or keep counting for longer bans?
                // For now, we keep counting to potentially increase ban time later
            }

            await prisma.user.update({
                where: { id: user.id },
                data: updateData
            });

            return res.status(401).json({
                message: 'Invalid credentials',
                attemptsLeft: Math.max(0, 3 - attempts)
            });
        }

        // 4. Successful Login - Reset Lockout
        if (user.failedLoginAttempts > 0) {
            await prisma.user.update({
                where: { id: user.id },
                data: { failedLoginAttempts: 0, lockUntil: null }
            });
        }

        // 5. Generate Tokens
        const accessToken = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET || 'secret_key', // Fallback for dev
            { expiresIn: '15m' }
        );

        const refreshToken = jwt.sign(
            { id: user.id },
            process.env.JWT_REFRESH_SECRET || 'refresh_secret_key',
            { expiresIn: '7d' }
        );

        // Save Refresh Token to DB
        await prisma.refreshToken.create({
            data: {
                token: refreshToken,
                userId: user.id,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
            }
        });

        res.json({
            message: 'Login successful',
            accessToken,
            refreshToken,
            userId: user.id,
            role: user.role
        });

    } catch (error) {
        next(error);
    }
};





// 3. VERIFY EMAIL
const verifyEmail = async (req, res, next) => {
    try {
        const { email, code } = req.body;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (user.isVerified) return res.status(400).json({ message: 'User already verified' });

        if (user.verificationToken !== code) {
            return res.status(400).json({ message: 'Invalid verification code' });
        }

        // Success
        await prisma.user.update({
            where: { id: user.id },
            data: { isVerified: true, verificationToken: null }
        });

        res.json({ message: 'Email verified successfully. You can now login.' });

    } catch (error) {
        next(error);
    }
};



// 4. FORGOT PASSWORD
const forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Generate Reset Token (random 32 bytes hex)
        const resetToken = crypto.randomBytes(32).toString('hex');

        // Hash token before saving to DB (security best practice)
        const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

        // Set token and expiry (1 hour)
        await prisma.user.update({
            where: { id: user.id },
            data: {
                resetToken: resetTokenHash,
            }
        });

        // Send Email
        await sendEmail(email, 'Password Reset Request', 'resetPassword', { token: resetToken });

        res.json({ message: 'Password reset email sent.' });

    } catch (error) {
        next(error);
    }
};

// 5. RESET PASSWORD
const resetPassword = async (req, res, next) => {
    try {
        const { token, newPassword } = req.body;

        // Hash the token to compare with DB
        const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

        const user = await prisma.user.findFirst({
            where: { resetToken: resetTokenHash }
        });

        if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

        // Update Password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetToken: null, // Clear token
                failedLoginAttempts: 0, // Unlock account if locked
                lockUntil: null
            }
        });

        res.json({ message: 'Password reset successful. You can now login with new password.' });

    } catch (error) {
        next(error);
    }
};

// 6. REFRESH TOKEN
const refreshToken = async (req, res, next) => {
    try {
        const { token } = req.body;

        if (!token) return res.status(400).json({ message: 'Token is required' });

        // 1. Find Token in DB
        const storedToken = await prisma.refreshToken.findUnique({
            where: { token }
        });

        if (!storedToken) return res.status(401).json({ message: 'Invalid refresh token' });

        // 2. Check if revoked
        if (storedToken.revoked) {
            return res.status(401).json({ message: 'Token revoked' });
        }

        // 3. Check expiry
        if (storedToken.expiresAt < new Date()) {
            return res.status(401).json({ message: 'Token expired' });
        }

        // 4. Verify Signature (Double check)
        jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'refresh_secret_key', async (err, decoded) => {
            if (err) return res.status(403).json({ message: 'Invalid token signature' });

            // 5. Generate New Access Token
            const user = await prisma.user.findUnique({ where: { id: storedToken.userId } });

            const newAccessToken = jwt.sign(
                { id: user.id, role: user.role },
                process.env.JWT_SECRET || 'secret_key',
                { expiresIn: '15m' }
            );

            // Optional: Rotate Refresh Token (Security Best Practice)
            // For now, we keep the same refresh token until it expires, to keep it simple.
            // But we could issue a new one and revoke the old one here.

            res.json({
                accessToken: newAccessToken,
                refreshToken: token // Return same refresh token
            });
        });

    } catch (error) {
        next(error);
    }
};

// 7. LOGOUT (Revoke Refresh Token)
const logout = async (req, res, next) => {
    try {
        const { token } = req.body;

        if (!token) return res.status(400).json({ message: 'Token is required' });

        // Revoke token in DB
        await prisma.refreshToken.updateMany({
            where: { token },
            data: { revoked: true }
        });

        res.json({ message: 'Logged out successfully' });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    register,
    login,
    verifyEmail,
    forgotPassword,
    resetPassword,
    refreshToken,
    logout
};
