const { Resend } = require('resend');

// Preview demo emails
async function previewDemoEmails() {
  console.log('🎨 Previewing Demo Email Templates...\n');
  
  const hasApiKey = !!process.env.RESEND_API_KEY;
  let resend = null;
  
  if (hasApiKey) {
    resend = new Resend(process.env.RESEND_API_KEY);
  } else {
    console.log('⚠️  No RESEND_API_KEY found - showing preview mode only\n');
  }
  
  // Test data
  const testUser = {
    email: 'test@example.com',
    userName: 'Sarah',
    position: 42
  };
  
  console.log('📧 Email Templates Available:\n');
  console.log('1. Welcome Email with Demo Access');
  console.log('   - Gold exclusive badge');
  console.log('   - Dashboard preview mockup');
  console.log('   - Demo access CTA');
  console.log('   - Position: #' + testUser.position);
  console.log('');
  
  console.log('2. Dedicated Demo Access Email');
  console.log('   - Browser mockup with stats');
  console.log('   - 87% goal success, $2.4k saved');
  console.log('   - Testimonial included');
  console.log('   - Limited time urgency');
  console.log('');
  
  console.log('🔗 Demo URL: https://lifenavigator-p4l7rhvtw-riffe007s-projects.vercel.app/');
  console.log('');
  
  // If API key exists, offer to send test email
  if (hasApiKey && resend) {
    console.log('📤 Send test email? (Using Resend test addresses)');
    console.log('   - From: onboarding@resend.dev');
    console.log('   - To: delivered@resend.dev');
    console.log('');
    console.log('Run: node preview-demo-emails.js --send');
    
    if (process.argv.includes('--send')) {
      console.log('\n📮 Sending test email...');
      
      try {
        const { data, error } = await resend.emails.send({
          from: 'LifeNavigator <onboarding@resend.dev>',
          to: ['delivered@resend.dev'],
          subject: '🌟 Demo Email Preview - LifeNavigator',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0;">
                  <span style="font-size: 40px;">🧭</span><br>
                  LifeNavigator
                </h1>
                <p style="color: white; opacity: 0.9;">Demo Email Preview</p>
              </div>
              <div style="padding: 40px; background: #f5f5f5;">
                <div style="text-align: center; margin-bottom: 20px;">
                  <span style="background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%); color: #1a1a1a; display: inline-block; padding: 8px 20px; border-radius: 20px; font-size: 12px; font-weight: 700; letter-spacing: 1px;">
                    🌟 EXCLUSIVE WAITLIST ACCESS
                  </span>
                </div>
                <h2 style="color: #333; text-align: center;">Demo Email Templates Ready!</h2>
                <p style="color: #666;">Your new demo access emails have been implemented with:</p>
                <ul style="color: #666; line-height: 1.8;">
                  <li>Gold exclusive waitlist badge</li>
                  <li>Dashboard preview mockup</li>
                  <li>Browser mockup with live stats</li>
                  <li>Purple gradient branding (#667eea → #764ba2)</li>
                  <li>Compass emoji logo (🧭)</li>
                </ul>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="https://lifenavigator.tech" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 25px; font-weight: 600;">
                    View Documentation
                  </a>
                </div>
              </div>
            </div>
          `,
        });
        
        if (error) {
          console.error('❌ Error:', error);
        } else {
          console.log('✅ Test email sent successfully!');
          console.log('📧 Email ID:', data?.id);
        }
      } catch (err) {
        console.error('❌ Unexpected error:', err);
      }
    }
  }
}

// Run the preview
previewDemoEmails();