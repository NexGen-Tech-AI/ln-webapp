import { createClient } from '@supabase/supabase-js'
import { emailTemplateService } from '../src/services/email-templates'

// Initialize Supabase Admin Client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

async function sendPlaidAnnouncement() {
  try {
    console.log('Starting Plaid announcement email campaign...')
    
    // Get all verified users
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('id, email, name')
      .eq('email_verified', true)
    
    if (error) {
      console.error('Error fetching users:', error)
      return
    }
    
    if (!users || users.length === 0) {
      console.log('No verified users found')
      return
    }
    
    console.log(`Found ${users.length} verified users`)
    
    // Email content
    const title = '🎉 Major Update: Plaid Integration Coming to LifeNavigator!'
    const content = `
      <p>We have incredible news to share with you!</p>
      
      <h3>🏦 Secure Bank Connectivity is Coming</h3>
      <p>We've partnered with <strong>Plaid</strong>, the industry leader in financial data connectivity, to bring you:</p>
      
      <ul style="line-height: 1.8;">
        <li>✅ <strong>Secure bank account linking</strong> - Connect all your accounts in one place</li>
        <li>📊 <strong>Real-time financial insights</strong> - See your complete financial picture instantly</li>
        <li>🤖 <strong>Automated expense tracking</strong> - No more manual entry</li>
        <li>💡 <strong>Intelligent wealth recommendations</strong> - AI-powered financial guidance</li>
        <li>🔒 <strong>Bank-level security</strong> - Your data is always encrypted and secure</li>
      </ul>
      
      <h3>🚀 Early Access for Pilot Members</h3>
      <p>This game-changing feature will be available first to our pilot members, then rolling out to all paid tiers. As a valued member of our waitlist, you'll be among the first to experience this revolutionary integration.</p>
      
      <h3>📈 What This Means for You</h3>
      <p>With Plaid integration, LifeNavigator becomes your complete financial command center. Track spending, monitor investments, plan for the future, and make smarter financial decisions - all in one beautiful, intuitive interface.</p>
      
      <p>This is just the beginning of our journey to help you navigate your financial empire. Stay tuned for more exciting updates!</p>
    `
    
    // Send emails in batches
    const batchSize = 10
    let successCount = 0
    let failCount = 0
    
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize)
      
      const results = await Promise.allSettled(
        batch.map(user => 
          emailTemplateService.sendUpdate(
            [user.email],
            title,
            content,
            {
              ctaText: 'View in Dashboard',
              ctaUrl: 'https://lifenavigator.tech/dashboard',
              type: 'feature'
            }
          )
        )
      )
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.success) {
          successCount++
          console.log(`✅ Sent to ${batch[index].email}`)
        } else {
          failCount++
          console.error(`❌ Failed to send to ${batch[index].email}:`, result.status === 'rejected' ? result.reason : result.value.error)
        }
      })
      
      // Rate limiting - wait between batches
      if (i + batchSize < users.length) {
        console.log(`Waiting 2 seconds before next batch...`)
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }
    
    // Log the campaign in audit_logs
    await supabaseAdmin
      .from('audit_logs')
      .insert({
        action: 'email_campaign_sent',
        entity_type: 'announcement',
        details: {
          type: 'plaid_integration_announcement',
          total_recipients: users.length,
          successful: successCount,
          failed: failCount
        }
      })
    
    console.log('\n📊 Campaign Complete!')
    console.log(`Total recipients: ${users.length}`)
    console.log(`Successful: ${successCount}`)
    console.log(`Failed: ${failCount}`)
    
  } catch (error) {
    console.error('Error sending announcement:', error)
  }
}

// Run the script
sendPlaidAnnouncement()