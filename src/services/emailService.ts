import { Resend } from 'resend';
import { WelcomeEmail } from '@/emails/WelcomeEmail';
import { WelcomeEmailWithDemo } from '@/emails/WelcomeEmailWithDemo';
import { DemoAccessEmail } from '@/emails/DemoAccessEmail';
import { UpdateEmail } from '@/emails/UpdateEmail';

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

export interface SendWelcomeEmailParams {
  email: string;
  userName: string;
  verificationToken?: string;
  includeDemo?: boolean;
  position?: number;
}

export interface SendUpdateEmailParams {
  email: string;
  userName: string;
  updateTitle: string;
  updateContent: string;
  features?: Array<{
    emoji: string;
    title: string;
    description: string;
  }>;
  ctaText?: string;
  ctaUrl?: string;
}

export interface SendBulkEmailParams {
  emails: string[];
  subject: string;
  content: React.ReactElement;
}

/**
 * Send welcome email to new user
 */
export async function sendWelcomeEmail({ 
  email, 
  userName, 
  verificationToken,
  includeDemo = true,
  position = 42
}: SendWelcomeEmailParams) {
  const verificationUrl = verificationToken 
    ? `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify?token=${verificationToken}`
    : `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`;

  try {
    const EmailComponent = includeDemo ? WelcomeEmailWithDemo : WelcomeEmail;
    const emailProps = includeDemo 
      ? { userName, verificationUrl, position }
      : { userName, verificationUrl };

    const { data, error } = await resend.emails.send({
      from: 'LifeNavigator <welcome@lifenavigator.tech>',
      to: [email],
      subject: `Welcome to LifeNavigator, ${userName}! 🎉`,
      react: EmailComponent(emailProps),
    });

    if (error) {
      throw new Error(error.message);
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return { success: false, error };
  }
}

/**
 * Send dedicated demo access email
 */
export async function sendDemoAccessEmail(
  email: string,
  userName: string,
  position: number = 42
) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'LifeNavigator <updates@lifenavigator.tech>',
      to: [email],
      subject: '🌟 Your Exclusive LifeNavigator Demo Access is Ready!',
      react: DemoAccessEmail({ userName, position }),
    });

    if (error) {
      throw new Error(error.message);
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error sending demo access email:', error);
    return { success: false, error };
  }
}

/**
 * Send update email to user
 */
export async function sendUpdateEmail(params: SendUpdateEmailParams) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'LifeNavigator <updates@lifenavigator.tech>',
      to: [params.email],
      subject: params.updateTitle,
      react: UpdateEmail(params),
    });

    if (error) {
      throw new Error(error.message);
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error sending update email:', error);
    return { success: false, error };
  }
}

/**
 * Send bulk emails (for updates to all users)
 */
export async function sendBulkEmails({ 
  emails, 
  subject, 
  content 
}: SendBulkEmailParams) {
  try {
    // Resend supports bulk sending up to 100 recipients
    const chunks = [];
    for (let i = 0; i < emails.length; i += 100) {
      chunks.push(emails.slice(i, i + 100));
    }

    const results = await Promise.all(
      chunks.map(chunk => 
        resend.emails.send({
          from: 'LifeNavigator <updates@lifenavigator.tech>',
          to: chunk,
          subject,
          react: content,
        })
      )
    );

    const errors = results.filter(r => r.error);
    if (errors.length > 0) {
      console.error('Some emails failed to send:', errors);
    }

    return { 
      success: true, 
      sent: results.length - errors.length,
      failed: errors.length 
    };
  } catch (error) {
    console.error('Error sending bulk emails:', error);
    return { success: false, error };
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string, 
  resetToken: string
) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${resetToken}`;
  
  try {
    const { data, error } = await resend.emails.send({
      from: 'LifeNavigator <security@lifenavigator.tech>',
      to: [email],
      subject: 'Reset Your LifeNavigator Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #667eea;">Reset Your Password</h2>
          <p>You requested to reset your password. Click the link below to create a new password:</p>
          <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; margin: 20px 0;">Reset Password</a>
          <p style="color: #666;">This link will expire in 1 hour for security reasons.</p>
          <p style="color: #999; font-size: 12px;">If you didn't request this, please ignore this email.</p>
        </div>
      `,
    });

    if (error) {
      throw new Error(error.message);
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return { success: false, error };
  }
}

/**
 * Send milestone notification email
 */
export async function sendMilestoneEmail(
  email: string,
  userName: string,
  milestone: string,
  message: string
) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'LifeNavigator <celebrations@lifenavigator.tech>',
      to: [email],
      subject: `🎉 Congratulations on reaching ${milestone}!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">🎉 Milestone Achieved!</h1>
          </div>
          <div style="padding: 40px; background: #f5f5f5;">
            <h2 style="color: #333;">Congratulations, ${userName}!</h2>
            <p style="font-size: 18px; color: #666;">${message}</p>
            <div style="background: white; padding: 20px; border-radius: 10px; margin: 20px 0;">
              <h3 style="color: #667eea; margin-top: 0;">${milestone}</h3>
              <p style="color: #666;">Keep up the amazing work! Your dedication is inspiring.</p>
            </div>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px;">View Your Progress</a>
          </div>
        </div>
      `,
    });

    if (error) {
      throw new Error(error.message);
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error sending milestone email:', error);
    return { success: false, error };
  }
}