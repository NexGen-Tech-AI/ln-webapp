import * as React from 'react';
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface DemoAccessEmailProps {
  userName: string;
  position: number;
  demoUrl?: string;
}

export const DemoAccessEmail = ({
  userName = 'there',
  position = 42,
  demoUrl = 'https://lifenavigator-p4l7rhvtw-riffe007s-projects.vercel.app/',
}: DemoAccessEmailProps) => {
  const previewText = `Your exclusive LifeNavigator demo access is ready!`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <span style={waitlistBadge}>
              🌟 WAITLIST MEMBER #{position}
            </span>
            <div style={logoContainer}>
              <div style={logoCircle}>
                <Text style={logoEmoji}>🧭</Text>
              </div>
            </div>
            <Heading style={h1}>
              Your Exclusive Access is Ready
            </Heading>
          </Section>

          {/* Main Content */}
          <Section style={content}>
            <Text style={greeting}>
              Hi {userName},
            </Text>
            <Text style={paragraph}>
              Thank you for your patience and trust in LifeNavigator. As one of our earliest supporters, 
              we're thrilled to give you <strong>exclusive early access</strong> to our demo environment.
            </Text>
            
            {/* Highlight Box */}
            <div style={highlightBox}>
              <Text style={highlightTitle}>
                🎯 What You'll Experience:
              </Text>
              <Text style={highlightContent}>
                • <strong>Goal Tracking:</strong> See our AI-powered achievement system in action<br/>
                • <strong>Smart Budgeting:</strong> Explore intelligent financial management tools<br/>
                • <strong>Nutrition AI:</strong> Preview our computer vision meal tracking<br/>
                • <strong>Risk Analysis:</strong> Test our decision-making framework<br/>
                • <strong>Full Dashboard:</strong> Navigate the complete user experience
              </Text>
            </div>

            {/* Browser Mockup */}
            <div style={browserContainer}>
              <div style={browserMockup}>
                <div style={browserBar}>
                  <div style={browserDots}>
                    <span style={redDot}></span>
                    <span style={yellowDot}></span>
                    <span style={greenDot}></span>
                  </div>
                  <div style={urlBar}>
                    lifenavigator.tech/demo
                  </div>
                </div>
                <div style={browserContent}>
                  <div style={browserHeader}>
                    <div style={logoInBrowser}>
                      <span style={logoEmojiBrowser}>🧭</span>
                    </div>
                    <div style={browserTitle}>LifeNavigator</div>
                    <div style={browserSubtitle}>Transform Your Life with AI</div>
                  </div>
                  <div style={statsContainer}>
                    <div style={statBox}>
                      <div style={statNumber}>87%</div>
                      <div style={statLabel}>Goal Success</div>
                    </div>
                    <div style={statBox}>
                      <div style={statNumber}>$2.4k</div>
                      <div style={statLabel}>Saved Monthly</div>
                    </div>
                    <div style={statBox}>
                      <div style={statNumber}>152</div>
                      <div style={statLabel}>Days Tracked</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA Section */}
            <div style={ctaSection}>
              <Button style={ctaButton} href={demoUrl}>
                Access Your Demo Now →
              </Button>
              <Text style={ctaNote}>
                No signup required • Full feature access • Available for limited time
              </Text>
            </div>

            {/* Testimonial */}
            <div style={testimonial}>
              <Text style={testimonialText}>
                "The demo blew me away! I can't wait for the full launch. This is exactly 
                what I've been looking for to organize my life."
              </Text>
              <Text style={testimonialAuthor}>
                — Sarah K., Waitlist Member #18
              </Text>
            </div>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              You're receiving this because you joined the LifeNavigator waitlist.<br />
              Your position: #{position} • Early access granted
            </Text>
            <Link href="https://lifenavigator.tech" style={footerLink}>
              lifenavigator.tech
            </Link>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

// Styles
const main = {
  backgroundColor: '#f5f5f5',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  borderRadius: '16px',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07)',
  margin: '40px auto',
  overflow: 'hidden',
  width: '600px',
  maxWidth: '100%',
};

const header = {
  background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
  padding: '40px',
  textAlign: 'center' as const,
};

const waitlistBadge = {
  background: 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)',
  color: '#1a1a1a',
  display: 'inline-block',
  padding: '8px 20px',
  borderRadius: '20px',
  fontSize: '12px',
  fontWeight: '700',
  letterSpacing: '1px',
  marginBottom: '20px',
};

const logoContainer = {
  marginBottom: '20px',
};

const logoCircle = {
  background: 'rgba(255, 255, 255, 0.1)',
  borderRadius: '50%',
  display: 'inline-block',
  padding: '15px',
  width: '60px',
  height: '60px',
  lineHeight: '30px',
};

const logoEmoji = {
  fontSize: '30px',
  margin: '0',
};

const h1 = {
  color: '#ffffff',
  fontSize: '36px',
  fontWeight: '700',
  letterSpacing: '-0.5px',
  margin: '0',
  lineHeight: '1.2',
};

const content = {
  padding: '40px',
};

const greeting = {
  color: '#1a1a1a',
  fontSize: '20px',
  fontWeight: '600',
  margin: '0 0 15px 0',
};

const paragraph = {
  color: '#666666',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 30px 0',
};

const highlightBox = {
  backgroundColor: '#f9f4ff',
  border: '2px solid #667eea',
  borderRadius: '12px',
  padding: '25px',
  margin: '0 0 30px 0',
};

const highlightTitle = {
  color: '#667eea',
  fontSize: '18px',
  fontWeight: '700',
  margin: '0 0 15px 0',
};

const highlightContent = {
  color: '#666666',
  fontSize: '15px',
  lineHeight: '1.8',
  margin: '0',
};

const browserContainer = {
  margin: '40px 0',
};

const browserMockup = {
  backgroundColor: '#f5f5f5',
  borderRadius: '12px',
  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
  overflow: 'hidden',
};

const browserBar = {
  backgroundColor: '#e0e0e0',
  padding: '12px 20px',
  display: 'flex',
  alignItems: 'center',
};

const browserDots = {
  display: 'flex',
  gap: '8px',
};

const redDot = {
  width: '12px',
  height: '12px',
  borderRadius: '50%',
  backgroundColor: '#ff5f57',
  display: 'inline-block',
};

const yellowDot = {
  width: '12px',
  height: '12px',
  borderRadius: '50%',
  backgroundColor: '#ffbd2e',
  display: 'inline-block',
};

const greenDot = {
  width: '12px',
  height: '12px',
  borderRadius: '50%',
  backgroundColor: '#28ca42',
  display: 'inline-block',
};

const urlBar = {
  backgroundColor: '#ffffff',
  borderRadius: '6px',
  color: '#666666',
  fontSize: '12px',
  padding: '6px 12px',
  marginLeft: '20px',
  flex: 1,
  textAlign: 'center' as const,
};

const browserContent = {
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  padding: '60px 40px',
  textAlign: 'center' as const,
};

const browserHeader = {
  marginBottom: '40px',
};

const logoInBrowser = {
  background: 'rgba(255, 255, 255, 0.2)',
  borderRadius: '50%',
  width: '60px',
  height: '60px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: '15px',
};

const logoEmojiBrowser = {
  fontSize: '30px',
};

const browserTitle = {
  color: '#ffffff',
  fontSize: '32px',
  fontWeight: '800',
  marginBottom: '10px',
};

const browserSubtitle = {
  color: '#ffffff',
  fontSize: '16px',
  opacity: 0.9,
};

const statsContainer = {
  display: 'flex',
  justifyContent: 'space-around',
  gap: '20px',
};

const statBox = {
  backgroundColor: 'rgba(255, 255, 255, 0.2)',
  borderRadius: '12px',
  padding: '20px',
  flex: 1,
};

const statNumber = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: '700',
  marginBottom: '5px',
};

const statLabel = {
  color: '#ffffff',
  fontSize: '12px',
  opacity: 0.9,
};

const ctaSection = {
  textAlign: 'center' as const,
  margin: '40px 0',
};

const ctaButton = {
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  borderRadius: '50px',
  color: '#ffffff',
  display: 'inline-block',
  fontSize: '20px',
  fontWeight: '600',
  letterSpacing: '0.5px',
  padding: '20px 50px',
  textDecoration: 'none',
  boxShadow: '0 6px 20px rgba(102, 126, 234, 0.4)',
};

const ctaNote = {
  color: '#999999',
  fontSize: '14px',
  margin: '15px 0 0 0',
};

const testimonial = {
  backgroundColor: '#f8f9fa',
  borderLeft: '4px solid #667eea',
  borderRadius: '8px',
  padding: '25px',
  margin: '40px 0 0 0',
};

const testimonialText = {
  color: '#666666',
  fontSize: '16px',
  fontStyle: 'italic',
  lineHeight: '1.6',
  margin: '0 0 15px 0',
};

const testimonialAuthor = {
  color: '#667eea',
  fontSize: '14px',
  fontWeight: '600',
  margin: '0',
};

const footer = {
  backgroundColor: '#f8f9fa',
  padding: '30px 40px',
  textAlign: 'center' as const,
};

const footerText = {
  color: '#999999',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0 0 10px 0',
};

const footerLink = {
  color: '#667eea',
  fontSize: '14px',
  textDecoration: 'none',
};

export default DemoAccessEmail;