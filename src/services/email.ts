import { Resend } from 'resend'
import { supabaseAdmin } from '@/lib/supabase'
import { emailTemplateService } from './email-templates'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM_EMAIL = 'LifeNavigator <noreply@lifenavigator.com>'
const REPLY_TO = 'support@lifenavigator.com'

interface EmailTemplate {
  subject: string
  html: string
  text?: string
}

export class EmailService {
  // Email Templates
  private getWelcomeEmailTemplate(name: string, email: string, position: number, referralCode: string): EmailTemplate {
    return {
      subject: 'Welcome to LifeNavigator! 🧭 Your Journey Begins',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .stats-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
              .referral-box { background: #e9ecef; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
              .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Welcome to LifeNavigator, ${name || 'Navigator'}! 🎉</h1>
                <p>You're officially on the waitlist for the future of life management</p>
              </div>
              <div class="content">
                <h2>Your Waitlist Position: #${position.toLocaleString()}</h2>
                
                <div class="stats-box">
                  <h3>🚀 What Happens Next?</h3>
                  <ul>
                    <li>We'll notify you when it's your turn to access LifeNavigator</li>
                    <li>You'll receive weekly updates on new features and development progress</li>
                    <li>Early access members get <strong>10% lifetime discount</strong></li>
                    <li>Refer friends to jump ahead in line!</li>
                  </ul>
                </div>

                <div class="referral-box">
                  <h3>🎁 Your Referral Code</h3>
                  <h1 style="color: #667eea; margin: 10px 0;">${referralCode}</h1>
                  <p>Share this code with friends. Each successful referral moves you up 100 spots!</p>
                  <a href="${process.env.NEXT_PUBLIC_APP_URL}/signup?ref=${referralCode}" class="button">Share Your Referral Link</a>
                </div>

                <h3>📱 Stay Connected</h3>
                <p>Follow our journey and get exclusive insights:</p>
                <ul>
                  <li>Twitter: <a href="https://twitter.com/lifenavigator">@lifenavigator</a></li>
                  <li>LinkedIn: <a href="https://linkedin.com/company/lifenavigator">LifeNavigator</a></li>
                  <li>Blog: <a href="https://blog.lifenavigator.com">blog.lifenavigator.com</a></li>
                </ul>

                <p style="margin-top: 30px;">Ready to navigate your empire? We can't wait to have you aboard!</p>
                
                <p>Best regards,<br>
                The LifeNavigator Team</p>
              </div>
              <div class="footer">
                <p>You're receiving this because you joined the LifeNavigator waitlist.</p>
                <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/api/user/unsubscribe?token=${Buffer.from(email).toString('base64')}&type=all">Unsubscribe</a> | <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard">View Dashboard</a></p>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `Welcome to LifeNavigator, ${name || 'Navigator'}!

Your Waitlist Position: #${position.toLocaleString()}

Your Referral Code: ${referralCode}
Share this code with friends. Each successful referral moves you up 100 spots!

What Happens Next?
- We'll notify you when it's your turn to access LifeNavigator
- You'll receive weekly updates on new features and development progress
- Early access members get 10% lifetime discount
- Refer friends to jump ahead in line!

Stay connected:
Twitter: @lifenavigator
LinkedIn: LifeNavigator

Best regards,
The LifeNavigator Team`
    }
  }

  private getUpdateNotificationTemplate(
    name: string,
    updateTitle: string,
    updateContent: string,
    updateType: string
  ): EmailTemplate {
    const emoji = updateType === 'feature' ? '✨' : updateType === 'milestone' ? '🎯' : '📢'
    
    return {
      subject: `${emoji} LifeNavigator Update: ${updateTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
              .update-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
              .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>${emoji} New Update from LifeNavigator</h1>
              </div>
              <div class="content">
                <p>Hi ${name || 'Navigator'},</p>
                
                <p>We have an exciting update to share with you!</p>
                
                <div class="update-box">
                  <h2>${updateTitle}</h2>
                  <p>${updateContent}</p>
                </div>

                <center>
                  <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="button">View in Dashboard</a>
                </center>

                <p>Thank you for being part of our journey. Your spot in the waitlist is secured, and we're working hard to bring you the best life management platform.</p>
                
                <p>Best regards,<br>
                The LifeNavigator Team</p>
              </div>
              <div class="footer">
                <p>You're receiving this because you're on the LifeNavigator waitlist.</p>
                <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe">Unsubscribe from updates</a></p>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `${emoji} New Update from LifeNavigator

Hi ${name || 'Navigator'},

We have an exciting update to share with you!

${updateTitle}

${updateContent}

View in Dashboard: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard

Thank you for being part of our journey.

Best regards,
The LifeNavigator Team`
    }
  }

  private getPilotApplicationConfirmationTemplate(name: string): EmailTemplate {
    return {
      subject: '🚀 Pilot Application Received - LifeNavigator',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
              .timeline { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
              .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🚀 Pilot Application Received!</h1>
              </div>
              <div class="content">
                <p>Hi ${name},</p>
                
                <p>Thank you for applying to be a LifeNavigator Pilot Member! Your application has been received and is under review.</p>
                
                <div class="timeline">
                  <h3>What happens next?</h3>
                  <ul>
                    <li><strong>Within 48 hours:</strong> Our team will review your application</li>
                    <li><strong>If approved:</strong> You'll receive early access and a 50% lifetime discount</li>
                    <li><strong>Your commitment:</strong> Weekly feedback to help shape the platform</li>
                  </ul>
                </div>

                <p>Pilot members are crucial to our success. You'll be among the first 1,000 users to experience LifeNavigator and your feedback will directly influence our development.</p>
                
                <p>We'll be in touch soon!</p>
                
                <p>Best regards,<br>
                The LifeNavigator Team</p>
              </div>
              <div class="footer">
                <p>Questions? Reply to this email or contact support@lifenavigator.com</p>
              </div>
            </div>
          </body>
        </html>
      `
    }
  }

  private getPartnershipAutoReplyTemplate(companyName: string, contactName: string): EmailTemplate {
    return {
      subject: 'Partnership Request Received - LifeNavigator',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #0066cc; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
              .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
              .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Partnership Request Received</h1>
              </div>
              <div class="content">
                <p>Dear ${contactName},</p>
                
                <p>Thank you for ${companyName}'s interest in partnering with LifeNavigator. We've received your partnership request and appreciate you taking the time to reach out.</p>
                
                <div class="info-box">
                  <h3>Next Steps:</h3>
                  <ul>
                    <li>Our partnerships team will review your proposal</li>
                    <li>We'll contact you within 3 business days</li>
                    <li>We may schedule a call to discuss opportunities</li>
                  </ul>
                </div>

                <p>LifeNavigator is building the future of life management, and we're excited about the possibility of working together to bring this vision to more people.</p>
                
                <p>If you have any immediate questions, please don't hesitate to reach out to partnerships@lifenavigator.com</p>
                
                <p>Best regards,<br>
                The LifeNavigator Partnerships Team</p>
              </div>
              <div class="footer">
                <p>LifeNavigator - Navigate Your Empire</p>
              </div>
            </div>
          </body>
        </html>
      `
    }
  }

  private getPaymentMethodAddedTemplate(name: string, cardLast4: string, tier: string): EmailTemplate {
    const tierNames = {
      'pro': 'Pro Navigator',
      'ai': 'AI Navigator+',
      'family': 'Family Navigator'
    }
    
    return {
      subject: '💳 Payment Method Added - LifeNavigator',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
              .payment-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #e9ecef; }
              .discount-banner { background: #28a745; color: white; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0; }
              .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Payment Method Successfully Added! 💳</h1>
              </div>
              <div class="content">
                <p>Hi ${name},</p>
                
                <p>Great news! Your payment method has been successfully added to your LifeNavigator account.</p>
                
                <div class="payment-box">
                  <h3>Payment Details:</h3>
                  <p><strong>Card ending in:</strong> ****${cardLast4}</p>
                  <p><strong>Selected tier:</strong> ${(tierNames as Record<string, string>)[tier] || tier}</p>
                  <p><strong>Auto-enrollment:</strong> Active ✅</p>
                </div>

                <div class="discount-banner">
                  <h3>🎉 You'll Save 15% at Launch!</h3>
                  <p>10% waitlist discount + 5% for setting up payment early</p>
                </div>

                <h3>What This Means:</h3>
                <ul>
                  <li>When your spot is ready, you'll be automatically enrolled</li>
                  <li>You'll receive an email before any charges are made</li>
                  <li>You can update or remove your payment method anytime</li>
                  <li>Your card information is securely stored with Stripe</li>
                </ul>

                <p>Thank you for your trust in LifeNavigator. We're working hard to deliver an amazing experience!</p>
                
                <p>Best regards,<br>
                The LifeNavigator Team</p>
              </div>
              <div class="footer">
                <p>Manage your payment method in your <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard">dashboard</a></p>
                <p>Questions? Contact support@lifenavigator.com</p>
              </div>
            </div>
          </body>
        </html>
      `
    }
  }

  // Main email sending methods
  async sendWelcomeEmail(userId: string) {
    try {
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('email, name, position, referral_code, verification_token')
        .eq('id', userId)
        .single()

      if (error || !user) throw error

      // Generate verification URL
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const verificationUrl = `${baseUrl}/auth/confirm?token=${user.verification_token}`

      // Use the new beautiful template
      const result = await emailTemplateService.sendWelcomeEmail(
        user.email,
        user.name || '',
        verificationUrl
      )

      if (result.success) {
        // Log the email send
        await supabaseAdmin
          .from('audit_logs')
          .insert({
            user_id: userId,
            action: 'email_sent',
            details: { type: 'welcome', email: user.email }
          })
      }

      return result
    } catch (error) {
      console.error('Failed to send welcome email:', error)
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  }

  async sendUpdateNotification(updateId: string) {
    try {
      // Get the update details
      const { data: update, error: updateError } = await supabaseAdmin
        .from('updates')
        .select('*')
        .eq('id', updateId)
        .single()

      if (updateError || !update) throw updateError

      // Get all users who have not unsubscribed
      const { data: users, error: usersError } = await supabaseAdmin
        .from('users')
        .select('id, email, name')
        .eq('email_verified', true)
        // In production, add: .eq('unsubscribed', false)

      if (usersError || !users) throw usersError

      // Send emails in batches to avoid rate limits
      const batchSize = 100
      const results = []

      for (let i = 0; i < users.length; i += batchSize) {
        const batch = users.slice(i, i + batchSize)
        
        const batchPromises = batch.map(user => {
          const template = this.getUpdateNotificationTemplate(
            user.name || '',
            update.title,
            update.content,
            update.type
          )

          return resend.emails.send({
            from: FROM_EMAIL,
            to: user.email,
            subject: template.subject,
            html: template.html,
            text: template.text,
            reply_to: REPLY_TO,
          })
        })

        const batchResults = await Promise.allSettled(batchPromises)
        results.push(...batchResults)

        // Add delay between batches to respect rate limits
        if (i + batchSize < users.length) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }

      // Log the email campaign
      await supabaseAdmin
        .from('audit_logs')
        .insert({
          action: 'email_campaign_sent',
          details: { 
            type: 'update_notification', 
            update_id: updateId,
            recipients_count: users.length,
            success_count: results.filter(r => r.status === 'fulfilled').length
          }
        })

      return { 
        success: true, 
        sent: results.filter(r => r.status === 'fulfilled').length,
        failed: results.filter(r => r.status === 'rejected').length
      }
    } catch (error) {
      console.error('Failed to send update notifications:', error)
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  }

  async sendPilotApplicationConfirmation(userId: string) {
    try {
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('email, name')
        .eq('id', userId)
        .single()

      if (error || !user) throw error

      const template = this.getPilotApplicationConfirmationTemplate(user.name || '')

      const result = await resend.emails.send({
        from: FROM_EMAIL,
        to: user.email,
        subject: template.subject,
        html: template.html,
        reply_to: REPLY_TO,
      })

      // Also notify admin
      await resend.emails.send({
        from: FROM_EMAIL,
        to: 'admin@lifenavigator.com',
        subject: `New Pilot Application: ${user.name || user.email}`,
        html: `<p>New pilot application received from ${user.name || 'Unknown'} (${user.email})</p>
               <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/pilot-applications">View Application</a></p>`,
      })

      return { success: true, id: result.data?.id }
    } catch (error) {
      console.error('Failed to send pilot confirmation:', error)
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  }

  async sendPartnershipAutoReply(partnershipId: string) {
    try {
      const { data: partnership, error } = await supabaseAdmin
        .from('partnership_requests')
        .select('*')
        .eq('id', partnershipId)
        .single()

      if (error || !partnership) throw error

      const template = this.getPartnershipAutoReplyTemplate(
        partnership.company_name,
        partnership.contact_name
      )

      const result = await resend.emails.send({
        from: FROM_EMAIL,
        to: partnership.contact_email,
        subject: template.subject,
        html: template.html,
        reply_to: 'partnerships@lifenavigator.com',
      })

      // Notify partnerships team
      await resend.emails.send({
        from: FROM_EMAIL,
        to: 'partnerships@lifenavigator.com',
        subject: `New Partnership Request: ${partnership.company_name}`,
        html: `
          <h2>New Partnership Request</h2>
          <p><strong>Company:</strong> ${partnership.company_name}</p>
          <p><strong>Contact:</strong> ${partnership.contact_name} (${partnership.contact_role})</p>
          <p><strong>Email:</strong> ${partnership.contact_email}</p>
          <p><strong>Types:</strong> ${partnership.partnership_types.join(', ')}</p>
          <p><strong>Proposal:</strong> ${partnership.proposal}</p>
          <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/partnerships">View in Admin</a></p>
        `,
      })

      return { success: true, id: result.data?.id }
    } catch (error) {
      console.error('Failed to send partnership auto-reply:', error)
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  }

  async sendPaymentMethodAddedEmail(userId: string, cardLast4: string, tier: string) {
    try {
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('email, name')
        .eq('id', userId)
        .single()

      if (error || !user) throw error

      const template = this.getPaymentMethodAddedTemplate(
        user.name || '',
        cardLast4,
        tier
      )

      const result = await resend.emails.send({
        from: FROM_EMAIL,
        to: user.email,
        subject: template.subject,
        html: template.html,
        reply_to: REPLY_TO,
      })

      return { success: true, id: result.data?.id }
    } catch (error) {
      console.error('Failed to send payment confirmation:', error)
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  }

  // Weekly digest email (can be triggered by a cron job)
  async sendWeeklyDigest() {
    try {
      // Get all verified users
      const { data: users, error } = await supabaseAdmin
        .from('users')
        .select('id, email, name, position, referral_count')
        .eq('email_verified', true)

      if (error || !users) throw error

      // Get recent updates
      const oneWeekAgo = new Date()
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

      const { data: updates } = await supabaseAdmin
        .from('updates')
        .select('*')
        .eq('published', true)
        .gte('published_at', oneWeekAgo.toISOString())
        .order('published_at', { ascending: false })

      const results = []
      for (const user of users) {
        // Calculate position changes based on referrals
        const positionJump = user.referral_count * 100

        const emailHtml = `
          <h2>Your Weekly LifeNavigator Update</h2>
          <p>Hi ${user.name || 'Navigator'},</p>
          <h3>Your Stats:</h3>
          <ul>
            <li>Current Position: #${user.position - positionJump}</li>
            <li>Referrals: ${user.referral_count}</li>
            <li>Position Jump: ${positionJump} spots</li>
          </ul>
          ${updates?.length ? `
            <h3>Recent Updates:</h3>
            ${updates.map(u => `<p><strong>${u.title}</strong><br>${u.content}</p>`).join('')}
          ` : ''}
          <p>Keep sharing your referral code to move up faster!</p>
        `

        const result = await resend.emails.send({
          from: FROM_EMAIL,
          to: user.email,
          subject: '📊 Your Weekly LifeNavigator Update',
          html: emailHtml,
          reply_to: REPLY_TO,
        })

        results.push(result)
      }

      return { success: true, sent: results.length }
    } catch (error) {
      console.error('Failed to send weekly digest:', error)
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  }
}

export const emailService = new EmailService()