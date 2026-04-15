import { createId } from "@paralleldrive/cuid2";
import nodemailer from "nodemailer";
import prisma from "@/lib/prisma";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_ADDRESS,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function sendVerificationEmail({ to, verificationUrl }) {
  const mailOptions = {
    from: process.env.GMAIL_ADDRESS,
    to,
    subject: "Verify Your Email Address",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background-color: #007bff;
              color: #ffffff;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #eee;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Verify Your Email Address</h2>
            <p>Thank you for signing up! Please verify your email address by clicking the button below:</p>
            <a href="${verificationUrl}" class="button">Verify Email</a>
            <p>Or copy and paste this link in your browser:</p>
            <p style="word-break: break-all;">${verificationUrl}</p>
            <div class="footer">
              <p>If you didn't create an account, you can safely ignore this email.</p>
              <p>This link will expire in 24 hours.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${to}`);
  } catch (error) {
    console.error("Error sending verification email:", error);
    throw error;
  }
}

export async function sendWelcomeEmail({ to, name }) {
  const mailOptions = {
    from: process.env.GMAIL_ADDRESS,
    to,
    subject: "Welcome to SellerBord!",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background-color: #28a745;
              color: #ffffff;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #eee;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Welcome to SellerBord, ${name}! 🎉</h2>
            <p>Thank you for joining us! We're excited to have you on board.</p>
            <p>Your account has been successfully created and verified. You can now access all the features and start your journey with us.</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}" class="button">Get Started</a>
            <div class="footer">
              <p>If you have any questions or need assistance, feel free to reach out to our support team.</p>
              <p>Best regards,<br>The SellerBord Team</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Welcome email sent to ${to}`);
  } catch (error) {
    console.error("Error sending welcome email:", error);
    throw error;
  }
}

export async function sendResetPasswordEmail({ to, resetPasswordUrl }) {
  const mailOptions = {
    from: process.env.GMAIL_ADDRESS,
    to,
    subject: "Reset Your Password",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background-color: #dc3545;
              color: #ffffff;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #eee;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Reset Your Password</h2>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            <a href="${resetPasswordUrl}" class="button">Reset Password</a>
            <p>Or copy and paste this link in your browser:</p>
            <p style="word-break: break-all;">${resetPasswordUrl}</p>
            <div class="footer">
              <p>If you didn't request a password reset, you can safely ignore this email.</p>
              <p>This link will expire in 1 hour.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Reset password email sent to ${to}`);
  } catch (error) {
    console.error("Error sending reset password email:", error);
    throw error;
  }
}

export async function sendDeleteAccountVerificationEmail({ user, url }) {
  const mailOptions = {
    from: process.env.GMAIL_ADDRESS,
    to: user.email,
    subject: "Confirm Account Deletion",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .warning-box {
              background-color: #fff3cd;
              border: 1px solid #ffc107;
              border-radius: 5px;
              padding: 15px;
              margin: 20px 0;
            }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background-color: #dc3545;
              color: #ffffff;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #eee;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Confirm Account Deletion</h2>
            <p>Hello ${user.name || "there"},</p>
            <p>We received a request to delete your SellerBord account. This action is permanent and cannot be undone.</p>
            
            <div class="warning-box">
              <strong>⚠️ Warning:</strong> Once you confirm, all your data will be permanently deleted, including:
              <ul>
                <li>Your profile information</li>
                <li>Your account settings</li>
                <li>All associated data</li>
              </ul>
            </div>

            <p>If you're sure you want to proceed, click the button below to confirm the deletion:</p>
            <a href="${url}" class="button">Confirm Account Deletion</a>
            <p>Or copy and paste this link in your browser:</p>
            <p style="word-break: break-all;">${url}</p>
            
            <div class="footer">
              <p>If you didn't request account deletion, please ignore this email and your account will remain active. We recommend changing your password if you believe someone else requested this.</p>
              <p>This link will expire in 1 hour for your security.</p>
              <p>Best regards,<br>The SellerBord Team</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Delete account verification email sent to ${user.email}`);
  } catch (error) {
    console.error("Error sending delete account verification email:", error);
    throw error;
  }
}

export async function sendMailboxAccessEmail({
  to,
  mailboxName,
  senderName,
  mailboxEmail,
  accessUrl,
}) {
  const mailOptions = {
    from: process.env.GMAIL_ADDRESS,
    to,
    subject: "Your MelMe mailbox is ready",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .details {
              background-color: #f8f9fa;
              border: 1px solid #e9ecef;
              border-radius: 8px;
              padding: 16px;
              margin: 16px 0;
            }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background-color: #2563eb;
              color: #ffffff;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #eee;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Your mailbox is ready</h2>
            <p>A new mailbox has been created for you in MelMe.</p>

            <div class="details">
              <p><strong>Mailbox name:</strong> ${mailboxName}</p>
              <p><strong>Sender name:</strong> ${senderName}</p>
              <p><strong>Mailbox address:</strong> ${mailboxEmail}</p>
            </div>

            <a href="${accessUrl}" class="button">Access Mailboxes</a>
            <p>Or copy and paste this link in your browser:</p>
            <p style="word-break: break-all;">${accessUrl}</p>

            <div class="footer">
              <p>For security reasons, mailbox passwords are never sent by email.</p>
              <p>Keep your mailbox password safe and use it to access your mailbox in MelMe.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Mailbox access email sent to ${to}`);
  } catch (error) {
    console.error("Error sending mailbox access email:", error);
    throw error;
  }
}

export async function sendMailboxPasswordResetEmail({
  to,
  aliasEmail,
  resetUrl,
}) {
  const mailOptions = {
    from: process.env.GMAIL_ADDRESS,
    to,
    subject: "Reset your MelMe mailbox password",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .details {
              background-color: #f8f9fa;
              border: 1px solid #e9ecef;
              border-radius: 8px;
              padding: 16px;
              margin: 16px 0;
            }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background-color: #dc3545;
              color: #ffffff;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #eee;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Reset mailbox password</h2>
            <p>We received a request to reset the mailbox password for this alias:</p>

            <div class="details">
              <p><strong>Alias:</strong> ${aliasEmail}</p>
            </div>

            <a href="${resetUrl}" class="button">Reset Mailbox Password</a>
            <p>Or copy and paste this link in your browser:</p>
            <p style="word-break: break-all;">${resetUrl}</p>

            <div class="footer">
              <p>If you didn't request this, you can safely ignore this email.</p>
              <p>This link will expire in 1 hour and can only be used once.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Mailbox password reset email sent to ${to}`);
  } catch (error) {
    console.error("Error sending mailbox password reset email:", error);
    throw error;
  }
}

/**
 * Resolve conversation ID for email threading
 * @param {Object} params - Parameters
 * @param {string} params.messageId - Current email's Message-ID
 * @param {string} params.inReplyTo - In-Reply-To header
 * @param {string} params.references - References header (space-separated)
 * @returns {Promise<string>} - Conversation ID (new or existing)
 */
export async function resolveConversationId({
  messageId: _messageId,
  inReplyTo,
  references,
}) {
  try {
    // 1. Try In-Reply-To - find parent email
    if (inReplyTo) {
      const parent = await prisma.emailLog.findUnique({
        where: { messageId: inReplyTo },
        select: { conversationId: true },
      });
      if (parent?.conversationId) {
        return parent.conversationId;
      }
    }

    // 2. Try References - space-separated message IDs
    if (references) {
      const refIds = references.trim().split(/\s+/);
      for (const refId of refIds) {
        const ref = await prisma.emailLog.findUnique({
          where: { messageId: refId },
          select: { conversationId: true },
        });
        if (ref?.conversationId) {
          return ref.conversationId;
        }
      }
    }

    // 3. Fallback: new conversation
    return createId();
  } catch (error) {
    console.error("Error resolving conversation ID:", error);
    // Fallback on error
    return createId();
  }
}

/**
 * Generate RFC 2822 compliant Message-ID
 * @param {string} domain - Domain name
 * @returns {string} - Message-ID in format <unique@domain>
 */
export function generateMessageId(domain) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `<${timestamp}.${random}@${domain}>`;
}
