const nodemailer = require('nodemailer');
require('dotenv').config();

// Create transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Send password reset email
const sendPasswordResetEmail = async (email, resetToken) => {
    // Temporary - use actual file path
    const resetUrl = `http://localhost:5500/frontend/reset-password.html?token=${resetToken}`;
    
    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'TRACE - Password Reset Request',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #2a2a2a; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #2a2a2a; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
                    .header h1 { color: #f5f1e8; margin: 0; font-size: 24px; }
                    .content { background: #f5f1e8; padding: 30px; border-radius: 0 0 10px 10px; }
                    .button { display: inline-block; background: #5a9f9f; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }
                    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                    .warning { background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #856404; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🔐 TRACE Password Reset</h1>
                    </div>
                    <div class="content">
                        <h2>Hello!</h2>
                        <p>You recently requested to reset your password for your TRACE account.</p>
                        <p>Click the button below to reset your password:</p>
                        
                        <center>
                            <a href="${resetUrl}" class="button">Reset My Password</a>
                        </center>
                        
                        <div class="warning">
                            <strong>⚠️ Security Notice:</strong>
                            <ul>
                                <li>This link will expire in 1 hour</li>
                                <li>If you didn't request this, please ignore this email</li>
                                <li>Never share this link with anyone</li>
                            </ul>
                        </div>
                        
                        <p>If the button doesn't work, copy and paste this link into your browser:</p>
                        <p style="word-break: break-all; color: #5a9f9f;">${resetUrl}</p>
                        
                        <p>Best regards,<br><strong>TRACE Team</strong></p>
                    </div>
                    <div class="footer">
                        <p>This is an automated email. Please do not reply.</p>
                        <p>&copy; 2026 TRACE - Tracking & Reflective Academic Coding Engine</p>
                    </div>
                </div>
            </body>
            </html>
        `
    };
    
    try {
        await transporter.sendMail(mailOptions);
        return { success: true };
    } catch (error) {
        console.error('Email send error:', error);
        return { success: false, error: error.message };
    }
};

module.exports = { sendPasswordResetEmail };