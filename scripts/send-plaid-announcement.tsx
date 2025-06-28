import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

// Initialize clients with environment variables
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

const resend = new Resend(process.env.RESEND_API_KEY!)

interface User {
  id: string
  email: string
  name: string | null
  email_verified: boolean
}

async function sendPlaidAnnouncement() {
  try {
    console.log('📧 Starting Plaid announcement email campaign...')
    
    // Get all verified users
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, name, email_verified')
      .eq('email_verified', true)
      .returns<User[]>()
    
    if (error) {
      console.error('❌ Error fetching users:', error)
      return
    }
    
    if (!users || users.length === 0) {
      console.log('⚠️ No verified users found')
      return
    }
    
    console.log(`✅ Found ${users.length} verified users`)
    
    let successCount = 0
    let failCount = 0
    
    // Send emails one by one with proper error handling
    for (const user of users) {
      try {
        const { data, error: emailError } = await resend.emails.send({
          from: 'LifeNavigator Updates <updates@lifenavigator.tech>',
          to: user.email,
          subject: '🎉 Major Update: Plaid Integration Coming to LifeNavigator!',
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background-color: #0a0e1a; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%); color: white; padding: 40px; text-align: center; border-radius: 16px 16px 0 0; }
                .content { background: #1e293b; padding: 30px; border-radius: 0 0 16px 16px; color: #e2e8f0; }
                .button { display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%); color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: 600; }
                .highlight { background: #312e81; padding: 20px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #7c3aed; }
                h1, h2, h3 { color: #ffffff; }
                ul { line-height: 1.8; }
                strong { color: #ffffff; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🎉 Exciting News, ${user.name || 'Navigator'}!</h1>
                  <p style="font-size: 18px; margin-top: 10px;">We're partnering with Plaid to revolutionize your financial management</p>
                </div>
                <div class="content">
                  <h2>Secure Bank Connectivity is Coming to LifeNavigator!</h2>
                  
                  <div class="highlight">
                    <h3>What's Plaid?</h3>
                    <p>Plaid is the industry leader in financial data connectivity, trusted by thousands of apps including Venmo, Robinhood, and Coinbase. They power secure connections between your bank accounts and the apps you love.</p>
                  </div>

                  <h3>This game-changing integration will bring you:</h3>
                  <ul>
                    <li>✅ <strong>Secure bank account linking</strong> - Connect all your accounts in one place</li>
                    <li>📊 <strong>Real-time financial insights</strong> - See your complete financial picture instantly</li>
                    <li>🤖 <strong>Automated expense tracking</strong> - No more manual data entry</li>
                    <li>💡 <strong>Intelligent wealth recommendations</strong> - AI-powered financial guidance</li>
                    <li>🔒 <strong>Bank-level security</strong> - Your data is always encrypted and secure</li>
                  </ul>

                  <h3>🚀 Early Access Timeline</h3>
                  <p>This feature will be available first to pilot members, then rolling out to all paid tiers. As a valued waitlist member, you'll be among the first to experience this revolutionary integration!</p>

                  <center>
                    <a href="https://lifenavigator.tech/dashboard" class="button">View Your Dashboard</a>
                  </center>

                  <p>This is just the beginning. We're building the future of life management, and you're part of this incredible journey.</p>
                  
                  <p style="margin-top: 30px;">Best regards,<br>
                  <strong>The LifeNavigator Team</strong></p>
                </div>
              </div>
            </body>
            </html>
          `,
          tags: [
            { name: 'category', value: 'announcement' },
            { name: 'type', value: 'feature' }
          ]
        })
        
        if (emailError) {
          throw emailError
        }
        
        successCount++
        console.log(`✅ Sent to ${user.email}`)
        
        // Small delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 100))
        
      } catch (err) {
        failCount++
        console.error(`❌ Failed to send to ${user.email}:`, err)
      }
    }
    
    // Log the campaign results
    await supabase
      .from('audit_logs')
      .insert({
        action: 'email_campaign_sent',
        entity_type: 'announcement',
        entity_id: null,
        details: {
          type: 'plaid_integration_announcement',
          total_recipients: users.length,
          successful: successCount,
          failed: failCount
        }
      })
    
    console.log('\n📊 Campaign Complete!')
    console.log(`Total recipients: ${users.length}`)
    console.log(`✅ Successful: ${successCount}`)
    console.log(`❌ Failed: ${failCount}`)
    
  } catch (error) {
    console.error('Error in announcement campaign:', error)
  }
}

// Run the announcement
sendPlaidAnnouncement()