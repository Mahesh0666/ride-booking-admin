const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS?.replace(/\s/g, ''),
  },
  tls: {
    rejectUnauthorized: false,
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
});

const sendEmail = async ({ to, subject, html }) => {
  try {
    const info = await transporter.sendMail({
      from: `"RideAdmin" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    logger.info(`Email sent to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
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
          <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px;">Password Reset Request</p>
        </div>
        <div style="padding: 32px; text-align: center;">
          <p style="color: #475569; font-size: 14px; margin-bottom: 8px;">Your verification code is:</p>
          <div style="background: #f8fafc; border: 2px dashed #6366f1; border-radius: 12px; padding: 20px; margin: 16px 0;">
            <span style="font-size: 36px; font-weight: bold; color: #6366f1; letter-spacing: 8px; font-family: monospace;">${otp}</span>
          </div>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 24px;">This code expires in 10 minutes.</p>
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
          <div style="width: 64px; height: 64px; background: #d1fae5; border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
            <span style="font-size: 32px;">✅</span>
          </div>
          <h2 style="color: #1e293b; margin: 0 0 12px; font-size: 20px;">Password Updated</h2>
          <p style="color: #475569; font-size: 14px; line-height: 1.6;">
            Your admin password has been changed successfully.<br>
            You can now login with your new credentials.
          </p>
          <div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <p style="color: #64748b; font-size: 12px; margin: 0;">If this wasn't you, contact support immediately.</p>
          </div>
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

const sendLoginNotification = async (email, { ip, device, browser, os, location, time }) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: Arial, sans-serif; background: #f1f5f9; padding: 40px;">
      <div style="max-width: 480px; margin: auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
        <div style="background: linear-gradient(135deg, #6366f1, #a855f7); padding: 32px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">RideAdmin</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px;">New Login Detected</p>
        </div>
        <div style="padding: 32px;">
          <p style="color: #475569; font-size: 14px; line-height: 1.6;">A new login was detected on your admin account.</p>
          <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin: 20px 0;">
            <table style="width: 100%; font-size: 13px; color: #475569;">
              <tr><td style="padding: 6px 0; font-weight: 600; color: #1e293b;">Time:</td><td style="padding: 6px 0;">${time}</td></tr>
              <tr><td style="padding: 6px 0; font-weight: 600; color: #1e293b;">IP Address:</td><td style="padding: 6px 0;">${ip}</td></tr>
              <tr><td style="padding: 6px 0; font-weight: 600; color: #1e293b;">Device:</td><td style="padding: 6px 0;">${device}</td></tr>
              <tr><td style="padding: 6px 0; font-weight: 600; color: #1e293b;">Browser:</td><td style="padding: 6px 0;">${browser}</td></tr>
              <tr><td style="padding: 6px 0; font-weight: 600; color: #1e293b;">OS:</td><td style="padding: 6px 0;">${os}</td></tr>
              <tr><td style="padding: 6px 0; font-weight: 600; color: #1e293b;">Location:</td><td style="padding: 6px 0;">${location}</td></tr>
            </table>
          </div>
          <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px; margin-top: 16px;">
            <p style="color: #dc2626; font-size: 12px; margin: 0;">If this wasn't you, change your password immediately.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
  return sendEmail({
    to: email,
    subject: '[RideAdmin] New Login Detected',
    html,
  });
};

module.exports = { sendEmail, sendOtpEmail, sendPasswordChangeConfirmation, sendLoginNotification };
