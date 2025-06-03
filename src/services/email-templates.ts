import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Base email template with consistent branding
const baseTemplate = (content: string, preheader: string = '') => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LifeNav</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  </style>
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0e1a; color: #ffffff;">
  <div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">${preheader}</div>
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #0a0e1a;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; width: 100%;">
          <!-- Header -->
          <tr>
            <td align="center" style="padding-bottom: 40px;">
              <div style="display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%); border-radius: 12px;">
                <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">LifeNav</h1>
              </div>
              <p style="margin: 10px 0 0 0; font-size: 14px; color: #94a3b8;">Your Life, Navigated Brilliantly</p>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td>
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top: 40px; border-top: 1px solid #1e293b;">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <p style="margin: 0; font-size: 12px; color: #64748b;">
                      © ${new Date().getFullYear()} LifeNav. All rights reserved.
                    </p>
                    <p style="margin: 10px 0 0 0; font-size: 12px; color: #64748b;">
                      <a href="{{{unsubscribe_url}}}" style="color: #7c3aed; text-decoration: none;">Unsubscribe</a> · 
                      <a href="{{{preferences_url}}}" style="color: #7c3aed; text-decoration: none;">Email Preferences</a> · 
                      <a href="https://lifenav.ai/privacy" style="color: #7c3aed; text-decoration: none;">Privacy Policy</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

// Welcome email template
export const welcomeEmailTemplate = (name: string, verificationUrl: string) => {
  const content = `
    <!-- Hero Section -->
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background: linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%); border-radius: 16px; overflow: hidden; margin-bottom: 30px;">
      <tr>
        <td align="center" style="padding: 60px 40px;">
          <h2 style="margin: 0 0 20px 0; font-size: 36px; font-weight: 700; color: #ffffff; line-height: 1.2;">
            Welcome to Your New Journey! 🚀
          </h2>
          <p style="margin: 0 0 30px 0; font-size: 18px; color: #cbd5e1; line-height: 1.6; max-width: 400px;">
            Hi${name ? ` ${name}` : ''}, we're thrilled to have you join the LifeNav community. Let's get you started!
          </p>
          <table cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td align="center">
                <a href="${verificationUrl}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%); color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 8px; box-shadow: 0 4px 14px 0 rgba(124, 58, 237, 0.4);">
                  Verify Your Email
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Content Sections -->
    <table cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td style="padding: 0 20px;">
          <!-- What's Next Section -->
          <div style="background: #1e293b; border-radius: 12px; padding: 30px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 20px 0; font-size: 24px; font-weight: 600; color: #ffffff;">
              Here's what happens next:
            </h3>
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td style="padding-bottom: 15px;">
                  <table cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td style="width: 40px; vertical-align: top;">
                        <div style="width: 32px; height: 32px; background: linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%); border-radius: 50%; text-align: center; line-height: 32px; color: #ffffff; font-weight: 600;">1</div>
                      </td>
                      <td style="vertical-align: top;">
                        <p style="margin: 0; font-size: 16px; color: #e2e8f0;">
                          <strong>Verify your email</strong> to secure your account
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding-bottom: 15px;">
                  <table cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td style="width: 40px; vertical-align: top;">
                        <div style="width: 32px; height: 32px; background: linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%); border-radius: 50%; text-align: center; line-height: 32px; color: #ffffff; font-weight: 600;">2</div>
                      </td>
                      <td style="vertical-align: top;">
                        <p style="margin: 0; font-size: 16px; color: #e2e8f0;">
                          <strong>Explore your dashboard</strong> and set up your profile
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td>
                  <table cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td style="width: 40px; vertical-align: top;">
                        <div style="width: 32px; height: 32px; background: linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%); border-radius: 50%; text-align: center; line-height: 32px; color: #ffffff; font-weight: 600;">3</div>
                      </td>
                      <td style="vertical-align: top;">
                        <p style="margin: 0; font-size: 16px; color: #e2e8f0;">
                          <strong>Get early access</strong> when we launch (you're #${Math.floor(Math.random() * 1000) + 1} in line!)
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </div>

          <!-- Special Offer Section -->
          <div style="background: linear-gradient(135deg, #312e81 0%, #1e3a8a 100%); border-radius: 12px; padding: 30px; margin-bottom: 20px; text-align: center;">
            <h3 style="margin: 0 0 10px 0; font-size: 20px; font-weight: 600; color: #ffffff;">
              🎁 Exclusive Launch Benefit
            </h3>
            <p style="margin: 0 0 20px 0; font-size: 16px; color: #e0e7ff;">
              As an early member, you'll get special perks when we launch!
            </p>
            <a href="https://lifenav.ai/referral" style="display: inline-block; padding: 12px 30px; background: #ffffff; color: #312e81; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 6px;">
              Learn More
            </a>
          </div>

          <!-- Help Section -->
          <div style="text-align: center; padding: 20px 0;">
            <p style="margin: 0 0 10px 0; font-size: 14px; color: #94a3b8;">
              Questions? We're here to help!
            </p>
            <p style="margin: 0; font-size: 14px;">
              <a href="mailto:support@lifenav.ai" style="color: #7c3aed; text-decoration: none;">support@lifenav.ai</a>
            </p>
          </div>
        </td>
      </tr>
    </table>
  `;
  
  return baseTemplate(content, "Welcome to LifeNav! Verify your email to get started.");
};

// Update/Announcement email template
export const updateEmailTemplate = (
  title: string,
  content: string,
  ctaText?: string,
  ctaUrl?: string,
  type: 'feature' | 'announcement' | 'milestone' = 'announcement'
) => {
  const typeConfig = {
    feature: {
      emoji: '✨',
      color: '#7c3aed',
      bgColor: '#312e81'
    },
    announcement: {
      emoji: '📢',
      color: '#3b82f6',
      bgColor: '#1e3a8a'
    },
    milestone: {
      emoji: '🎉',
      color: '#10b981',
      bgColor: '#064e3b'
    }
  };

  const config = typeConfig[type];
  
  const emailContent = `
    <!-- Header -->
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 30px;">
      <tr>
        <td align="center" style="padding: 40px 20px; background: linear-gradient(135deg, ${config.bgColor} 0%, #0f172a 100%); border-radius: 16px;">
          <div style="font-size: 48px; margin-bottom: 20px;">${config.emoji}</div>
          <h2 style="margin: 0; font-size: 32px; font-weight: 700; color: #ffffff;">
            ${title}
          </h2>
        </td>
      </tr>
    </table>

    <!-- Content -->
    <table cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td style="padding: 0 20px;">
          <div style="background: #1e293b; border-radius: 12px; padding: 30px; margin-bottom: 30px;">
            <div style="font-size: 16px; color: #e2e8f0; line-height: 1.6;">
              ${content}
            </div>
          </div>

          ${ctaText && ctaUrl ? `
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td align="center" style="padding: 20px 0;">
                  <a href="${ctaUrl}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, ${config.color} 0%, #3b82f6 100%); color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 8px; box-shadow: 0 4px 14px 0 rgba(59, 130, 246, 0.4);">
                    ${ctaText}
                  </a>
                </td>
              </tr>
            </table>
          ` : ''}
        </td>
      </tr>
    </table>
  `;
  
  return baseTemplate(emailContent, title);
};

// Weekly digest template
export const weeklyDigestTemplate = (
  userName: string,
  stats: {
    referralCount: number;
    position: number;
    newFeatures: string[];
    upcomingEvents: string[];
  }
) => {
  const content = `
    <!-- Greeting -->
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 30px;">
      <tr>
        <td style="padding: 30px; background: #1e293b; border-radius: 12px;">
          <h2 style="margin: 0 0 10px 0; font-size: 28px; font-weight: 700; color: #ffffff;">
            Your Weekly Update 📊
          </h2>
          <p style="margin: 0; font-size: 16px; color: #cbd5e1;">
            Hey ${userName}, here's what's happening with LifeNav this week!
          </p>
        </td>
      </tr>
    </table>

    <!-- Stats Grid -->
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 30px;">
      <tr>
        <td style="padding: 0 10px;">
          <table cellpadding="0" cellspacing="0" border="0" width="48%" align="left" style="margin-bottom: 20px;">
            <tr>
              <td style="background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%); padding: 30px; border-radius: 12px; text-align: center;">
                <p style="margin: 0 0 5px 0; font-size: 14px; color: #e9d5ff;">Your Position</p>
                <p style="margin: 0; font-size: 36px; font-weight: 700; color: #ffffff;">#${stats.position}</p>
              </td>
            </tr>
          </table>
          
          <table cellpadding="0" cellspacing="0" border="0" width="48%" align="right" style="margin-bottom: 20px;">
            <tr>
              <td style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 30px; border-radius: 12px; text-align: center;">
                <p style="margin: 0 0 5px 0; font-size: 14px; color: #dbeafe;">Referrals</p>
                <p style="margin: 0; font-size: 36px; font-weight: 700; color: #ffffff;">${stats.referralCount}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    ${stats.newFeatures.length > 0 ? `
      <!-- New Features -->
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 30px;">
        <tr>
          <td style="padding: 30px; background: #1e293b; border-radius: 12px;">
            <h3 style="margin: 0 0 20px 0; font-size: 20px; font-weight: 600; color: #ffffff;">
              ✨ Coming Soon
            </h3>
            ${stats.newFeatures.map(feature => `
              <p style="margin: 0 0 10px 0; font-size: 16px; color: #e2e8f0;">
                • ${feature}
              </p>
            `).join('')}
          </td>
        </tr>
      </table>
    ` : ''}

    <!-- Share CTA -->
    <table cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td align="center" style="padding: 30px; background: linear-gradient(135deg, #312e81 0%, #1e3a8a 100%); border-radius: 12px;">
          <h3 style="margin: 0 0 10px 0; font-size: 20px; font-weight: 600; color: #ffffff;">
            Move up the waitlist! 🚀
          </h3>
          <p style="margin: 0 0 20px 0; font-size: 16px; color: #e0e7ff;">
            Share your referral link and get early access
          </p>
          <a href="https://lifenav.ai/dashboard" style="display: inline-block; padding: 12px 30px; background: #ffffff; color: #312e81; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 6px;">
            Get Your Link
          </a>
        </td>
      </tr>
    </table>
  `;
  
  return baseTemplate(content, "Your LifeNav weekly update");
};

// Email sender service
export class EmailTemplateService {
  async sendWelcomeEmail(to: string, name: string, verificationUrl: string) {
    try {
      const { data, error } = await resend.emails.send({
        from: 'LifeNav <welcome@lifenav.ai>',
        to,
        subject: 'Welcome to LifeNav! 🚀',
        html: welcomeEmailTemplate(name, verificationUrl),
        tags: [
          { name: 'category', value: 'welcome' }
        ]
      });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      return { success: false, error };
    }
  }

  async sendUpdate(
    to: string[],
    title: string,
    content: string,
    options?: {
      ctaText?: string;
      ctaUrl?: string;
      type?: 'feature' | 'announcement' | 'milestone';
    }
  ) {
    try {
      const { data, error } = await resend.emails.send({
        from: 'LifeNav Updates <updates@lifenav.ai>',
        to,
        subject: title,
        html: updateEmailTemplate(
          title,
          content,
          options?.ctaText,
          options?.ctaUrl,
          options?.type || 'announcement'
        ),
        tags: [
          { name: 'category', value: 'update' },
          { name: 'type', value: options?.type || 'announcement' }
        ]
      });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Failed to send update email:', error);
      return { success: false, error };
    }
  }

  async sendWeeklyDigest(
    to: string,
    userName: string,
    stats: {
      referralCount: number;
      position: number;
      newFeatures: string[];
      upcomingEvents: string[];
    }
  ) {
    try {
      const { data, error } = await resend.emails.send({
        from: 'LifeNav <digest@lifenav.ai>',
        to,
        subject: `${userName}, your weekly LifeNav update 📊`,
        html: weeklyDigestTemplate(userName, stats),
        tags: [
          { name: 'category', value: 'digest' }
        ]
      });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Failed to send weekly digest:', error);
      return { success: false, error };
    }
  }
}

export const emailTemplateService = new EmailTemplateService();