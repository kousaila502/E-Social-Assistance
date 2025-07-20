const nodemailer = require('nodemailer');

// Create reusable transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

// Base HTML template for emails
const getEmailTemplate = (title, content, actionButton = null) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f4f4f4;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          padding: 0;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          text-align: center;
          border-radius: 8px 8px 0 0;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 300;
        }
        .content {
          padding: 40px 30px;
        }
        .content h2 {
          color: #2c3e50;
          margin-bottom: 20px;
          font-size: 20px;
        }
        .content p {
          margin-bottom: 15px;
          color: #555;
        }
        .button {
          display: inline-block;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 12px 30px;
          text-decoration: none;
          border-radius: 5px;
          margin: 20px 0;
          font-weight: bold;
          text-align: center;
        }
        .button:hover {
          opacity: 0.9;
        }
        .footer {
          background-color: #f8f9fa;
          padding: 20px 30px;
          text-align: center;
          border-radius: 0 0 8px 8px;
          border-top: 1px solid #e9ecef;
        }
        .footer p {
          margin: 5px 0;
          font-size: 12px;
          color: #6c757d;
        }
        .footer a {
          color: #667eea;
          text-decoration: none;
        }
        .divider {
          height: 1px;
          background-color: #e9ecef;
          margin: 20px 0;
        }
        .highlight {
          background-color: #f8f9fa;
          padding: 15px;
          border-left: 4px solid #667eea;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Social Assistance Management System</h1>
        </div>
        <div class="content">
          ${content}
          ${actionButton || ''}
        </div>
        <div class="footer">
          <p>This email was sent from the Social Assistance Management System</p>
          <p>If you didn't request this email, please ignore it or <a href="${process.env.CLIENT_URL}/contact">contact support</a></p>
          <p><a href="${process.env.CLIENT_URL}/unsubscribe">Unsubscribe</a> | <a href="${process.env.CLIENT_URL}/privacy">Privacy Policy</a></p>
          <p>&copy; ${new Date().getFullYear()} Social Assistance Management System. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Send email verification
const sendVerificationEmail = async ({ firstName, email, verificationToken, origin }) => {
  const verifyUrl = `${origin}/verify-email?token=${verificationToken}&email=${email}`;
  
  const content = `
    <h2>Welcome ${firstName}!</h2>
    <p>Thank you for registering with our Social Assistance Management System.</p>
    <p>To complete your registration and activate your account, please verify your email address by clicking the button below:</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${verifyUrl}" class="button">Verify Email Address</a>
    </div>
    <div class="highlight">
      <p><strong>Important:</strong> This verification link will expire in 24 hours for security reasons.</p>
    </div>
    <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #667eea;">${verifyUrl}</p>
  `;

  const htmlContent = getEmailTemplate('Email Verification Required', content);
  
  const textContent = `
    Welcome ${firstName}!
    
    Thank you for registering with our Social Assistance Management System.
    
    To complete your registration, please verify your email address by visiting:
    ${verifyUrl}
    
    This verification link will expire in 24 hours.
    
    If you didn't create this account, please ignore this email.
  `;

  try {
    const transporter = createTransporter();
    
    await transporter.sendMail({
      from: `"Social Assistance System" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Verify Your Email Address',
      html: htmlContent,
      text: textContent
    });

    console.log(`Verification email sent to ${email}`);
    return { success: true, message: 'Verification email sent successfully' };
  } catch (error) {
    console.error('Failed to send verification email:', error);
    return { success: false, message: 'Failed to send verification email' };
  }
};

// Send password reset email
const sendResetPasswordEmail = async ({ firstName, email, passwordToken, origin }) => {
  const resetUrl = `${origin}/reset-password?token=${passwordToken}&email=${email}`;
  
  const content = `
    <h2>Password Reset Request</h2>
    <p>Hello ${firstName},</p>
    <p>We received a request to reset the password for your account associated with this email address.</p>
    <p>If you made this request, click the button below to reset your password:</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetUrl}" class="button">Reset Password</a>
    </div>
    <div class="highlight">
      <p><strong>Security Notice:</strong> This reset link will expire in 1 hour for your security.</p>
    </div>
    <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #667eea;">${resetUrl}</p>
    <div class="divider"></div>
    <p><strong>Didn't request this?</strong> If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
  `;

  const htmlContent = getEmailTemplate('Reset Your Password', content);
  
  const textContent = `
    Password Reset Request
    
    Hello ${firstName},
    
    We received a request to reset your password. If you made this request, visit:
    ${resetUrl}
    
    This reset link will expire in 1 hour.
    
    If you didn't request this, please ignore this email.
  `;

  try {
    const transporter = createTransporter();
    
    await transporter.sendMail({
      from: `"Social Assistance System" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Reset Your Password',
      html: htmlContent,
      text: textContent
    });

    console.log(`Password reset email sent to ${email}`);
    return { success: true, message: 'Password reset email sent successfully' };
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    return { success: false, message: 'Failed to send password reset email' };
  }
};

// Send welcome email after verification
const sendWelcomeEmail = async ({ firstName, email, origin }) => {
  const dashboardUrl = `${origin}/dashboard`;
  
  const content = `
    <h2>Welcome to Social Assistance Management System!</h2>
    <p>Hello ${firstName},</p>
    <p>Congratulations! Your email has been successfully verified and your account is now active.</p>
    <p>You can now access all the features of our platform, including:</p>
    <ul style="margin: 20px 0; padding-left: 20px;">
      <li>Submit assistance requests</li>
      <li>Track your application status</li>
      <li>Receive important updates and notifications</li>
      <li>Access available programs and services</li>
    </ul>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${dashboardUrl}" class="button">Access Your Dashboard</a>
    </div>
    <div class="highlight">
      <p><strong>Need Help?</strong> Our support team is here to assist you. Visit our help center or contact us directly.</p>
    </div>
  `;

  const htmlContent = getEmailTemplate('Welcome to Our Platform!', content);
  
  const textContent = `
    Welcome to Social Assistance Management System!
    
    Hello ${firstName},
    
    Your email has been successfully verified and your account is now active.
    
    You can now access your dashboard at: ${dashboardUrl}
    
    Features available:
    - Submit assistance requests
    - Track application status
    - Receive updates and notifications
    - Access programs and services
    
    Welcome aboard!
  `;

  try {
    const transporter = createTransporter();
    
    await transporter.sendMail({
      from: `"Social Assistance System" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Welcome! Your Account is Ready',
      html: htmlContent,
      text: textContent
    });

    console.log(`Welcome email sent to ${email}`);
    return { success: true, message: 'Welcome email sent successfully' };
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    return { success: false, message: 'Failed to send welcome email' };
  }
};

// Send general notification email
const sendNotificationEmail = async ({ firstName, email, subject, message, actionUrl = null, actionText = 'View Details' }) => {
  let actionButton = '';
  if (actionUrl) {
    actionButton = `
      <div style="text-align: center; margin: 30px 0;">
        <a href="${actionUrl}" class="button">${actionText}</a>
      </div>
    `;
  }

  const content = `
    <h2>Notification</h2>
    <p>Hello ${firstName},</p>
    <div class="highlight">
      ${message}
    </div>
    ${actionButton}
  `;

  const htmlContent = getEmailTemplate(subject, content);
  
  const textContent = `
    ${subject}
    
    Hello ${firstName},
    
    ${message.replace(/<[^>]*>/g, '')}
    
    ${actionUrl ? `View details: ${actionUrl}` : ''}
  `;

  try {
    const transporter = createTransporter();
    
    await transporter.sendMail({
      from: `"Social Assistance System" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: subject,
      html: htmlContent,
      text: textContent
    });

    console.log(`Notification email sent to ${email}`);
    return { success: true, message: 'Notification email sent successfully' };
  } catch (error) {
    console.error('Failed to send notification email:', error);
    return { success: false, message: 'Failed to send notification email' };
  }
};

// Send status update email for requests
const sendStatusUpdateEmail = async ({ firstName, email, requestTitle, requestId, oldStatus, newStatus, message = '', origin }) => {
  const viewUrl = `${origin}/requests/${requestId}`;
  
  const statusColors = {
    'pending': '#ffc107',
    'under_review': '#17a2b8',
    'approved': '#28a745',
    'rejected': '#dc3545',
    'completed': '#6f42c1'
  };

  const content = `
    <h2>Request Status Update</h2>
    <p>Hello ${firstName},</p>
    <p>The status of your assistance request has been updated:</p>
    
    <div class="highlight">
      <p><strong>Request:</strong> ${requestTitle}</p>
      <p><strong>Request ID:</strong> #${requestId}</p>
      <p><strong>Previous Status:</strong> <span style="color: ${statusColors[oldStatus] || '#6c757d'}; font-weight: bold;">${oldStatus.replace('_', ' ').toUpperCase()}</span></p>
      <p><strong>New Status:</strong> <span style="color: ${statusColors[newStatus] || '#6c757d'}; font-weight: bold;">${newStatus.replace('_', ' ').toUpperCase()}</span></p>
    </div>
    
    ${message ? `<p><strong>Additional Information:</strong></p><p>${message}</p>` : ''}
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${viewUrl}" class="button">View Request Details</a>
    </div>
  `;

  const htmlContent = getEmailTemplate('Request Status Updated', content);
  
  const textContent = `
    Request Status Update
    
    Hello ${firstName},
    
    Your assistance request status has been updated:
    
    Request: ${requestTitle}
    Request ID: #${requestId}
    Previous Status: ${oldStatus.replace('_', ' ').toUpperCase()}
    New Status: ${newStatus.replace('_', ' ').toUpperCase()}
    
    ${message ? `Additional Information: ${message}` : ''}
    
    View details: ${viewUrl}
  `;

  try {
    const transporter = createTransporter();
    
    await transporter.sendMail({
      from: `"Social Assistance System" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Request Status Updated: ${requestTitle}`,
      html: htmlContent,
      text: textContent
    });

    console.log(`Status update email sent to ${email} for request ${requestId}`);
    return { success: true, message: 'Status update email sent successfully' };
  } catch (error) {
    console.error('Failed to send status update email:', error);
    return { success: false, message: 'Failed to send status update email' };
  }
};

module.exports = {
  sendVerificationEmail,
  sendResetPasswordEmail,
  sendWelcomeEmail,
  sendNotificationEmail,
  sendStatusUpdateEmail
};
