// Simple script to send Plaid announcement email
// Run with: node send-announcement.js

const { createClient } = require('@supabase/supabase-js');
const { Resend } = require('resend');

// Initialize clients
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendAnnouncement() {
  try {
    // Get all users
    const { data: users, error } = await supabase
      .from('users')
      .select('email, name')
      .eq('email_verified', true);
    
    if (error) throw error;
    
    console.log(`Sending to ${users.length} users...`);
    
    // Send email
    for (const user of users) {
      try {
        await resend.emails.send({
          from: 'LifeNavigator Updates <updates@lifenavigator.tech>',
          to: user.email,
          subject: '🎉 Major Update: Plaid Integration Coming to LifeNavigator!',
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
                .highlight { background: #e9ecef; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🎉 Exciting News, ${user.name || 'Navigator'}!</h1>
                  <p>We're partnering with Plaid to revolutionize your financial management</p>
                </div>
                <div class="content">
                  <h2>Secure Bank Connectivity is Coming to LifeNavigator!</h2>
                  
                  <div class="highlight">
                    <h3>What's Plaid?</h3>
                    <p>Plaid is the industry leader in financial data connectivity, trusted by thousands of apps including Venmo, Robinhood, and Coinbase.</p>
                  </div>

                  <h3>This integration will bring you:</h3>
                  <ul>
                    <li>✅ <strong>Secure bank account linking</strong> - Connect all your accounts in one place</li>
                    <li>📊 <strong>Real-time financial insights</strong> - See your complete financial picture instantly</li>
                    <li>🤖 <strong>Automated expense tracking</strong> - No more manual entry</li>
                    <li>💡 <strong>Intelligent wealth recommendations</strong> - AI-powered financial guidance</li>
                    <li>🔒 <strong>Bank-level security</strong> - Your data is always encrypted and secure</li>
                  </ul>

                  <h3>🚀 Early Access Timeline</h3>
                  <p>This feature will be available first to pilot members, then rolling out to all paid tiers. As a valued waitlist member, you'll be among the first to experience this game-changing integration!</p>

                  <center>
                    <a href="https://lifenavigator.tech/dashboard" class="button">View Your Dashboard</a>
                  </center>

                  <p>This is just the beginning. We're building the future of life management, and you're part of this journey.</p>
                  
                  <p>Best regards,<br>
                  The LifeNavigator Team</p>
                </div>
              </div>
            </body>
            </html>
          `
        });
        console.log(`✅ Sent to ${user.email}`);
      } catch (err) {
        console.error(`❌ Failed to send to ${user.email}:`, err.message);
      }
    }
    
    console.log('Done!');
  } catch (error) {
    console.error('Error:', error);
  }
}

sendAnnouncement();