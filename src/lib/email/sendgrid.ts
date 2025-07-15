import sgMail from '@sendgrid/mail';

// Initialize SendGrid with API key
const apiKey = process.env.SENDGRID_API_KEY;
if (apiKey) {
  sgMail.setApiKey(apiKey);
}

export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(options: EmailOptions) {
  const { to, subject, text, html } = options;
  
  console.log('SendEmail called with:', { to, subject, hasHtml: !!html, hasText: !!text });
  
  if (!process.env.SENDGRID_API_KEY) {
    console.error('SendGrid API key not configured');
    return false;
  }

  if (!process.env.SENDGRID_FROM_EMAIL) {
    console.error('SendGrid from email not configured');
    return false;
  }

  const msg = {
    to,
    from: process.env.SENDGRID_FROM_EMAIL,
    subject,
    text: text || 'This email requires HTML support to display properly.',
    html: html || text || 'This email requires HTML support to display properly.'
  };

  console.log('Sending email with message:', {
    to: msg.to,
    from: msg.from,
    subject: msg.subject,
    hasText: !!msg.text,
    hasHtml: !!msg.html
  });

  try {
    const response = await sgMail.send(msg);
    console.log('SendGrid response:', response);
    console.log(`Email sent successfully to ${to}`);
    return true;
  } catch (error) {
    console.error('SendGrid error details:', error);
    if (error.response) {
      console.error('SendGrid response body:', error.response.body);
      console.error('SendGrid response status:', error.response.status);
    }
    return false;
  }
}

export async function sendPasswordResetEmail(email: string, resetToken: string) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;
  
  const subject = 'Reset Your Password - Beiersdorf Media Nebula';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: #0EA5E9;
          color: white;
          padding: 30px;
          text-align: center;
          border-radius: 10px 10px 0 0;
        }
        .content {
          background-color: #f9f9f9;
          padding: 30px;
          border-radius: 0 0 10px 10px;
        }
        .button {
          display: inline-block;
          padding: 12px 30px;
          background-color: #0EA5E9;
          color: white;
          text-decoration: none;
          border-radius: 5px;
          margin: 20px 0;
        }
        .footer {
          margin-top: 30px;
          font-size: 12px;
          color: #666;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Beiersdorf Media Nebula</h1>
      </div>
      <div class="content">
        <h2>Password Reset Request</h2>
        <p>Hello,</p>
        <p>We received a request to reset your password. Click the button below to create a new password:</p>
        <p style="text-align: center;">
          <a href="${resetUrl}" class="button">Reset Password</a>
        </p>
        <p>This link will expire in 1 hour for security reasons.</p>
        <p>If you didn't request a password reset, please ignore this email.</p>
        <p><strong>Alternative:</strong> You can also copy and paste this link into your browser:</p>
        <p style="word-break: break-all; font-size: 12px;">${resetUrl}</p>
      </div>
      <div class="footer">
        <p>© 2024 Beiersdorf Media Nebula. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject,
    html,
  });
}

export async function sendWelcomeEmail(email: string, name: string, verificationToken: string) {
  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${verificationToken}`;
  
  const subject = 'Welcome to Beiersdorf Media Nebula';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: #0EA5E9;
          color: white;
          padding: 30px;
          text-align: center;
          border-radius: 10px 10px 0 0;
        }
        .content {
          background-color: #f9f9f9;
          padding: 30px;
          border-radius: 0 0 10px 10px;
        }
        .button {
          display: inline-block;
          padding: 12px 30px;
          background-color: #0EA5E9;
          color: white;
          text-decoration: none;
          border-radius: 5px;
          margin: 20px 0;
        }
        .footer {
          margin-top: 30px;
          font-size: 12px;
          color: #666;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Welcome to Beiersdorf Media Nebula!</h1>
      </div>
      <div class="content">
        <h2>Hello ${name || 'there'}!</h2>
        <p>Thank you for registering with Beiersdorf Media Nebula. We're excited to have you on board!</p>
        <p>Please verify your email address by clicking the button below:</p>
        <p style="text-align: center;">
          <a href="${verifyUrl}" class="button">Verify Email</a>
        </p>
        <p>Once verified, you'll have access to all the features of our media sufficiency platform.</p>
        <p><strong>Alternative:</strong> You can also copy and paste this link into your browser:</p>
        <p style="word-break: break-all; font-size: 12px;">${verifyUrl}</p>
      </div>
      <div class="footer">
        <p>© 2024 Beiersdorf Media Nebula. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject,
    html,
  });
}