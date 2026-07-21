import User from '../models/User.js';
import UserPreference from '../models/UserPreference.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import db from '../config/db.js';
import { sendPasswordResetEmail } from '../utils/email.js';

const generateToken = (user) => {
    return jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
    );
};

export const register = async (req, res, next) => {
    try {
        const { email, password, name } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email, password, and name'
            });
        }

        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email'
            });
        }

        const user = await User.create({ email, password, name });

        await UserPreference.upsert(user.id, {
            dietary_restrictions: [],
            allergies: [],
            preferred_cuisines: [],
            default_servings: 4,
            measurement_unit: 'metric'
        });

        const token = generateToken(user);

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user: { id: user.id, email: user.email, name: user.name },
                token
            }
        });

    } catch (error) {
        next(error);
    }
};

export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const isPasswordValid = await User.verifyPassword(password, user.password_hash);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const token = generateToken(user);

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: { id: user.id, email: user.email, name: user.name },
                token
            }
        });

    } catch (error) {
        next(error);
    }
};

export const getCurrentUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({ success: true, data: { user } });

    } catch (error) {
        next(error);
    }
};

// ─── Password Reset: Step 1 — Request token ───────────────────────────────────
export const requestPasswordReset = async (req, res, next) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email'
            });
        }

        // Always return same message — don't reveal if email exists
        const user = await User.findByEmail(email);

        if (user) {
            // Generate a secure random token
            const resetToken = crypto.randomBytes(32).toString('hex');
            const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

            // Invalidate any existing tokens for this user
            await db.query(
                `DELETE FROM password_reset_tokens WHERE user_id = $1`,
                [user.id]
            );

            // Store the new token
            await db.query(
                `INSERT INTO password_reset_tokens (user_id, token, expires_at)
                 VALUES ($1, $2, $3)`,
                [user.id, resetToken, expiresAt]
            );

            // Send email — if email not configured, log the link instead
            try {
                await sendPasswordResetEmail(user.email, user.name, resetToken);
            } catch (emailError) {
                console.error('Email send failed:', emailError.message);
                // In development, log the reset URL so you can test without email
                if (process.env.NODE_ENV === 'development') {
                    console.log(`\n🔑 Password reset link (dev only):`);
                    console.log(`${process.env.FRONTEND_URL}/reset-password?token=${resetToken}\n`);
                }
            }
        }

        res.json({
            success: true,
            message: 'If an account exists with this email, a password reset link has been sent'
        });

    } catch (error) {
        next(error);
    }
};

// ─── Password Reset: Step 2 — Validate token ──────────────────────────────────
export const validateResetToken = async (req, res, next) => {
    try {
        const { token } = req.params;

        const result = await db.query(
            `SELECT * FROM password_reset_tokens
             WHERE token = $1 AND used = false AND expires_at > NOW()`,
            [token]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Reset token is invalid or has expired'
            });
        }

        res.json({ success: true, message: 'Token is valid' });

    } catch (error) {
        next(error);
    }
};

// ─── Password Reset: Step 3 — Set new password ────────────────────────────────
export const resetPassword = async (req, res, next) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Please provide token and new password'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters'
            });
        }

        // Find valid token
        const result = await db.query(
            `SELECT * FROM password_reset_tokens
             WHERE token = $1 AND used = false AND expires_at > NOW()`,
            [token]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Reset token is invalid or has expired'
            });
        }

        const resetRecord = result.rows[0];

        // Update the password
        await User.updatePassword(resetRecord.user_id, newPassword);

        // Mark token as used
        await db.query(
            `UPDATE password_reset_tokens SET used = true WHERE id = $1`,
            [resetRecord.id]
        );

        res.json({
            success: true,
            message: 'Password reset successfully. You can now log in.'
        });

    } catch (error) {
        next(error);
    }
};
