const { Resend } = require('resend');

// Test Resend integration
async function testEmail() {
  const resend = new Resend(process.env.RESEND_API_KEY);
  
  console.log('Testing Resend email integration...');
  
  if (!process.env.RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY not found in environment variables');
    console.log('Please add RESEND_API_KEY to your .env.local file');
    return;
  }
  
  try {
    const { data, error } = await resend.emails.send({
      from: 'LifeNavigator <onboarding@resend.dev>', // Use Resend's test domain
      to: ['delivered@resend.dev'], // Resend's test email
      subject: 'Test Welcome Email - LifeNavigator',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">🧭 LifeNavigator</h1>
            <p style="color: white; opacity: 0.9;">Email Test</p>
          </div>
          <div style="padding: 40px; background: #f5f5f5;">
            <h2 style="color: #333;">Test Email Working!</h2>
            <p style="color: #666;">This is a test of the Resend email integration for LifeNavigator.</p>
            <p style="color: #666;">If you're seeing this, the email system is configured correctly!</p>
            <a href="https://lifenavigator.tech" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; margin-top: 20px;">Visit LifeNavigator</a>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('❌ Error:', error);
    } else {
      console.log('✅ Email sent successfully!');
      console.log('📧 Email ID:', data?.id);
      console.log('\nNext steps:');
      console.log('1. Add your domain to Resend dashboard');
      console.log('2. Verify domain ownership with DNS records');
      console.log('3. Update the "from" address to use your domain');
    }
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

// Run the test
testEmail();