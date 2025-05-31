// Simplified email service that can work without external dependencies
import { supabaseAdmin } from '@/lib/supabase'

export class SimpleEmailService {
  // Store email queue in database for processing
  async queueEmail(to: string, subject: string, html: string, text?: string) {
    try {
      // Create an email_queue table in Supabase to store pending emails
      const { error } = await supabaseAdmin
        .from('email_queue')
        .insert({
          to,
          subject,
          html,
          text,
          status: 'pending',
          created_at: new Date().toISOString()
        })

      if (error) throw error

      // In production, this would be processed by a background job
      console.log(`Email queued for ${to}: ${subject}`)
      
      return { success: true }
    } catch (error) {
      console.error('Email queue error:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  async sendWelcomeEmail(userId: string) {
    try {
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('email, name, position, referral_code')
        .eq('id', userId)
        .single()

      if (!user) throw new Error('User not found')

      const subject = 'Welcome to LifeNavigator! 🧭'
      const html = `
        <h1>Welcome ${user.name || 'Navigator'}!</h1>
        <p>Your position: #${user.position}</p>
        <p>Your referral code: ${user.referral_code}</p>
        <p>Share this link: ${process.env.NEXT_PUBLIC_APP_URL}/signup?ref=${user.referral_code}</p>
      `

      return this.queueEmail(user.email, subject, html)
    } catch (error) {
      console.error('Welcome email error:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  // Add other email methods as needed...
}

export const simpleEmailService = new SimpleEmailService()