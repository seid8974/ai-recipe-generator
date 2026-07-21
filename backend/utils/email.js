import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const createTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
};

export const sendPasswordResetEmail = async (email, name, resetToken) => {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const transporter = createTransporter();

    const mailOptions = {
        from: `"AI Recipe Generator" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Reset Your Password',
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #10b981; font-size: 28px; margin: 0;">🍳 AI Recipe Generator</h1>
            </div>

            <div style="background: #f9fafb; border-radius: 12px; padding: 30px;">
                <h2 style="color: #111827; margin-top: 0;">Hi ${name},</h2>
                <p style="color: #6b7280; line-height: 1.6;">
                    We received a request to reset your password. Click the button below to create a new password.
                    This link expires in <strong>1 hour</strong>.
                </p>

                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetUrl}"
                       style="background: #10b981; color: white; padding: 14px 32px; border-radius: 8px;
                              text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block;">
                        Reset Password
                    </a>
                </div>

                <p style="color: #9ca3af; font-size: 13px; line-height: 1.6;">
                    If you didn't request this, you can safely ignore this email.
                    Your password will not change.
                </p>

                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />

                <p style="color: #9ca3af; font-size: 12px;">
                    Or copy this link: <a href="${resetUrl}" style="color: #10b981;">${resetUrl}</a>
                </p>
            </div>
        </div>
        `
    };

    await transporter.sendMail(mailOptions);
};
