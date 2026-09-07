const { Resend } = require('resend');
const logger = require('../utils/logger');

const resendKey = process.env.RESEND_API_KEY;
logger.info(`Resend API key loaded: ${resendKey ? 'yes (length: ' + resendKey.length + ')' : 'NO'}`);

const resend = new Resend(resendKey);

const sendEmail = async ({ to, subject, html }) => {
  try {
    const result = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: [to],
      subject,
      html,
    });

    if (result.error) {
      logger.error(`Resend API error: ${JSON.stringify(result.error)}`);
      throw new Error(result.error.message);
    }

    logger.info(`Email sent to ${to}: ${result.data?.id}`);
    return { success: true, messageId: result.data?.id };
  } catch (err) {
    logger.error(`Email send failed: ${err.message}`);
    throw err;
  }
};

const sendOtpEmail = async (email, otp) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: Arial, sans-serif; background: #f1f5f9; padding: 40px;">
      <div style="max-width: 480px; margin: auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
        <div style="background: linear-gradient(135deg, #6366f1, #a855f7); padding: 32px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">RideAdmin</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px;">Login Verification</p>
        </div>
        <div style="padding: 32px; text-align: center;">
          <p style="color: #475569; font-size: 14px; margin-bottom: 8px;">Your verification code is:</p>
          <div style="background: #f8fafc; border: 2px dashed #6366f1; border-radius: 12px; padding: 20px; margin: 16px 0;">
            <span style="font-size: 36px; font-weight: bold; color: #6366f1; letter-spacing: 8px; font-family: monospace;">${otp}</span>
          </div>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 24px;">This code expires in 5 minutes.</p>
          <p style="color: #94a3b8; font-size: 12px;">If you didn't request this, ignore this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  return sendEmail({
    to: email,
    subject: `[RideAdmin] Your OTP Code: ${otp}`,
    html,
  });
};

const sendPasswordChangeConfirmation = async (email) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: Arial, sans-serif; background: #f1f5f9; padding: 40px;">
      <div style="max-width: 480px; margin: auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
        <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 32px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">RideAdmin</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px;">Password Changed Successfully</p>
        </div>
        <div style="padding: 32px; text-align: center;">
          <h2 style="color: #1e293b; margin: 0 0 12px; font-size: 20px;">Password Updated</h2>
          <p style="color: #475569; font-size: 14px; line-height: 1.6;">Your admin password has been changed successfully.</p>
          <p style="color: #94a3b8; font-size: 11px; margin-top: 20px;">${new Date().toLocaleString()}</p>
        </div>
      </div>
    </body>
    </html>
  `;
  return sendEmail({
    to: email,
    subject: '[RideAdmin] Password Changed Successfully',
    html,
  });
};

const sendLoginNotification = async (email, data) => {
  return Promise.resolve();
};

module.exports = { sendEmail, sendOtpEmail, sendPasswordChangeConfirmation, sendLoginNotification };
