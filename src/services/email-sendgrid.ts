// Alternative email service using SendGrid (if you prefer over Resend)
import sgMail from '@sendgrid/mail'
import { supabaseAdmin } from '@/lib/supabase'

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY!)

const FROM_EMAIL = 'noreply@lifenavigator.com'
const REPLY_TO = 'support@lifenavigator.com'

interface EmailTemplate {
  subject: string
  html: string
  text?: string
}

export class EmailServiceSendGrid {
  // Copy all the template methods from email.ts here...
  
  async sendEmail(to: string, template: EmailTemplate) {
    try {
      const msg = {
        to,
        from: FROM_EMAIL,
        subject: template.subject,
        html: template.html,
        text: template.text,
        replyTo: REPLY_TO,
      }

      await sgMail.send(msg)
      return { success: true }
    } catch (error) {
      console.error('SendGrid error:', error)
      return { success: false, error: error.message }
    }
  }

  // Use this sendEmail method in place of resend.emails.send() in all methods
}