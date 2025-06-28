import * as React from 'react';
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
  Column,
} from '@react-email/components';

interface WelcomeEmailWithDemoProps {
  userName: string;
  verificationUrl: string;
  demoUrl?: string;
  position?: number;
}

export const WelcomeEmailWithDemo = ({
  userName = 'there',
  verificationUrl = 'https://lifenavigator.tech/verify',
  demoUrl = 'https://lifenavigator-p4l7rhvtw-riffe007s-projects.vercel.app/',
  position = 42,
}: WelcomeEmailWithDemoProps) => {
  const previewText = `Welcome to LifeNavigator, ${userName}! Verify your account and access our exclusive demo.`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header with gradient */}
          <Section style={header}>
            <div style={logoContainer}>
              <div style={logoCircle}>
                <Text style={logoEmoji}>🧭</Text>
              </div>
            </div>
            <Heading style={h1}>LifeNavigator</Heading>
            <Text style={subtitle}>Your Journey Begins Here</Text>
          </Section>

          {/* Welcome message */}
          <Section style={content}>
            <Heading as="h2" style={h2}>
              Welcome aboard, {userName}! 🎉
            </Heading>
            <Text style={paragraph}>
              We're thrilled to have you join the LifeNavigator community. You're just one click away 
              from unlocking powerful tools to transform your life.
            </Text>
          </Section>

          {/* CTA Button */}
          <Section style={buttonContainer}>
            <Button style={button} href={verificationUrl}>
              Verify My Account
            </Button>
          </Section>

          {/* EXCLUSIVE DEMO SECTION */}
          <Section style={demoSection}>
            <div style={exclusiveBadgeContainer}>
              <span style={exclusiveBadge}>
                🌟 EXCLUSIVE WAITLIST ACCESS
              </span>
            </div>
            <Heading as="h3" style={demoHeading}>
              Get an Early Preview of LifeNavigator
            </Heading>
            <Text style={demoText}>
              As waitlist member #{position}, you have exclusive access to explore our demo account. 
              See firsthand how LifeNavigator will transform your daily life.
            </Text>
            
            {/* Demo Preview Card */}
            <div style={demoCard}>
              {/* Dashboard Mockup */}
              <div style={dashboardMockup}>
                <div style={mockupContent}>
                  {/* Mini Header */}
                  <div style={mockupHeader}>
                    <div style={mockupLogo}>LN</div>
                    <div style={mockupDots}>
                      <span style={dot}></span>
                      <span style={dot}></span>
                      <span style={dot}></span>
                    </div>
                  </div>
                  {/* Dashboard Grid */}
                  <div style={dashboardGrid}>
                    <div style={gridItem}>
                      <div style={gridChart}></div>
                      <div style={gridLabel}></div>
                    </div>
                    <div style={gridItem}>
                      <div style={gridChart}></div>
                      <div style={gridLabel}></div>
                    </div>
                    <div style={gridItem}>
                      <div style={gridChart}></div>
                      <div style={gridLabel}></div>
                    </div>
                    <div style={gridItem}>
                      <div style={gridChart}></div>
                      <div style={gridLabel}></div>
                    </div>
                  </div>
                </div>
              </div>
              
              <Heading as="h4" style={demoCardTitle}>
                Experience the Full Dashboard
              </Heading>
              <Text style={demoFeatures}>
                • Track goals with AI insights<br/>
                • Manage budgets intelligently<br/>
                • Monitor nutrition automatically<br/>
                • Access premium analytics
              </Text>
              <Button style={demoButton} href={demoUrl}>
                Access Demo Account →
              </Button>
              <Text style={demoNote}>
                Demo credentials will be provided on the next page
              </Text>
            </div>
          </Section>

          {/* Features section */}
          <Section style={featuresSection}>
            <Heading as="h3" style={h3}>
              What awaits you:
            </Heading>

            <Row style={featureRow}>
              <Column style={iconColumn}>
                <div style={featureIcon}>🎯</div>
              </Column>
              <Column style={featureContent}>
                <Heading as="h4" style={h4}>Goal Achievement System</Heading>
                <Text style={featureText}>
                  Track and accomplish your personal and professional goals with AI-powered insights.
                </Text>
              </Column>
            </Row>

            <Row style={featureRow}>
              <Column style={iconColumn}>
                <div style={featureIcon}>💰</div>
              </Column>
              <Column style={featureContent}>
                <Heading as="h4" style={h4}>Smart Budget Management</Heading>
                <Text style={featureText}>
                  Take control of your finances with intelligent budgeting and expense tracking.
                </Text>
              </Column>
            </Row>

            <Row style={featureRow}>
              <Column style={iconColumn}>
                <div style={featureIcon}>🍎</div>
              </Column>
              <Column style={featureContent}>
                <Heading as="h4" style={h4}>AI Nutrition Tracking</Heading>
                <Text style={featureText}>
                  Scan your meals for instant calorie and macro tracking powered by computer vision.
                </Text>
              </Column>
            </Row>
          </Section>

          {/* Security notice */}
          <Section style={securitySection}>
            <Text style={securityText}>
              🔒 This verification link will expire in 24 hours for your security.
            </Text>
            <Text style={securitySubtext}>
              If you didn't create an account with LifeNavigator, please ignore this email.
            </Text>
          </Section>

          {/* Alternative verification */}
          <Section style={alternativeSection}>
            <Text style={alternativeText}>
              Having trouble with the button? Copy and paste this link into your browser:
            </Text>
            <Link href={verificationUrl} style={link}>
              {verificationUrl}
            </Link>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerTitle}>LifeNavigator</Text>
            <Text style={footerSubtitle}>Navigate Your Empire</Text>
            
            <Row style={socialLinks}>
              <Column align="center">
                <Link href="https://twitter.com/lifenavigator" style={socialLink}>Twitter</Link>
                <Text style={separator}>•</Text>
                <Link href="https://linkedin.com/company/lifenavigator" style={socialLink}>LinkedIn</Link>
                <Text style={separator}>•</Text>
                <Link href="https://lifenavigator.tech/support" style={socialLink}>Support</Link>
              </Column>
            </Row>
            
            <Text style={legal}>
              © 2025 LifeNavigator. All rights reserved.
              <br />
              <Link href="https://lifenavigator.tech/privacy" style={legalLink}>
                Privacy Policy
              </Link>{' '}
              |{' '}
              <Link href="https://lifenavigator.tech/terms" style={legalLink}>
                Terms of Service
              </Link>
            </Text>
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
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  padding: '60px 40px',
  textAlign: 'center' as const,
};

const logoContainer = {
  marginBottom: '20px',
};

const logoCircle = {
  background: 'rgba(255, 255, 255, 0.2)',
  borderRadius: '50%',
  display: 'inline-block',
  padding: '20px',
  backdropFilter: 'blur(10px)',
  width: '80px',
  height: '80px',
  lineHeight: '40px',
};

const logoEmoji = {
  fontSize: '40px',
  margin: '0',
};

const h1 = {
  color: '#ffffff',
  fontSize: '48px',
  fontWeight: '800',
  letterSpacing: '-1px',
  margin: '0',
};

const subtitle = {
  color: '#ffffff',
  fontSize: '18px',
  fontWeight: '300',
  margin: '10px 0 0 0',
  opacity: 0.9,
};

const content = {
  padding: '50px 40px 30px 40px',
};

const h2 = {
  color: '#1a1a1a',
  fontSize: '32px',
  fontWeight: '700',
  lineHeight: '1.2',
  margin: '0 0 10px 0',
};

const h3 = {
  color: '#1a1a1a',
  fontSize: '24px',
  fontWeight: '600',
  margin: '30px 0 20px 0',
  textAlign: 'center' as const,
};

const h4 = {
  color: '#1a1a1a',
  fontSize: '18px',
  fontWeight: '600',
  margin: '0 0 5px 0',
};

const paragraph = {
  color: '#666666',
  fontSize: '18px',
  lineHeight: '1.6',
  margin: '0 0 25px 0',
};

const buttonContainer = {
  padding: '0 40px 40px 40px',
  textAlign: 'center' as const,
};

const button = {
  backgroundColor: '#667eea',
  backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  borderRadius: '50px',
  color: '#ffffff',
  display: 'inline-block',
  fontSize: '18px',
  fontWeight: '600',
  letterSpacing: '0.5px',
  lineHeight: '100%',
  padding: '18px 50px',
  textDecoration: 'none',
  textAlign: 'center' as const,
};

// Demo Section Styles
const demoSection = {
  padding: '40px',
  backgroundColor: '#f9f4ff',
  borderTop: '3px solid #667eea',
  borderBottom: '3px solid #764ba2',
  margin: '40px 0',
};

const exclusiveBadgeContainer = {
  textAlign: 'center' as const,
  marginBottom: '20px',
};

const exclusiveBadge = {
  background: 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)',
  color: '#1a1a1a',
  display: 'inline-block',
  padding: '8px 20px',
  borderRadius: '20px',
  fontSize: '12px',
  fontWeight: '700',
  letterSpacing: '1px',
};

const demoHeading = {
  color: '#1a1a1a',
  fontSize: '28px',
  fontWeight: '700',
  margin: '0 0 15px 0',
  textAlign: 'center' as const,
};

const demoText = {
  color: '#666666',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 30px 0',
  textAlign: 'center' as const,
};

const demoCard = {
  backgroundColor: '#ffffff',
  borderRadius: '16px',
  boxShadow: '0 10px 30px rgba(102, 126, 234, 0.1)',
  padding: '30px',
  textAlign: 'center' as const,
  maxWidth: '500px',
  margin: '0 auto',
};

const dashboardMockup = {
  backgroundColor: '#1a1a1a',
  borderRadius: '12px',
  height: '280px',
  overflow: 'hidden',
  position: 'relative' as const,
  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
  marginBottom: '25px',
};

const mockupContent = {
  padding: '20px',
  height: '100%',
};

const mockupHeader = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '20px',
};

const mockupLogo = {
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '700',
  padding: '8px 12px',
};

const mockupDots = {
  display: 'flex',
  gap: '8px',
};

const dot = {
  width: '8px',
  height: '8px',
  backgroundColor: '#444',
  borderRadius: '50%',
  display: 'inline-block',
};

const dashboardGrid = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '15px',
  height: 'calc(100% - 60px)',
};

const gridItem = {
  backgroundColor: '#2a2a2a',
  borderRadius: '8px',
  padding: '15px',
};

const gridChart = {
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  height: '60px',
  borderRadius: '6px',
  marginBottom: '10px',
  opacity: 0.8,
};

const gridLabel = {
  backgroundColor: '#444',
  height: '8px',
  borderRadius: '4px',
  width: '70%',
};

const demoCardTitle = {
  color: '#1a1a1a',
  fontSize: '22px',
  fontWeight: '700',
  margin: '0 0 15px 0',
};

const demoFeatures = {
  color: '#666666',
  fontSize: '16px',
  lineHeight: '1.8',
  margin: '0 0 25px 0',
  textAlign: 'left' as const,
};

const demoButton = {
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  borderRadius: '50px',
  color: '#ffffff',
  display: 'inline-block',
  fontSize: '18px',
  fontWeight: '600',
  letterSpacing: '0.5px',
  padding: '18px 40px',
  textDecoration: 'none',
  marginBottom: '15px',
  boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
};

const demoNote = {
  color: '#999999',
  fontSize: '14px',
  fontStyle: 'italic',
  margin: '0',
};

const featuresSection = {
  backgroundColor: '#f8f9fa',
  padding: '0 40px 40px 40px',
};

const featureRow = {
  marginBottom: '20px',
};

const iconColumn = {
  width: '60px',
  verticalAlign: 'top' as const,
};

const featureIcon = {
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  borderRadius: '12px',
  fontSize: '24px',
  height: '50px',
  lineHeight: '50px',
  textAlign: 'center' as const,
  width: '50px',
};

const featureContent = {
  paddingLeft: '20px',
  verticalAlign: 'top' as const,
};

const featureText = {
  color: '#666666',
  fontSize: '16px',
  lineHeight: '1.5',
  margin: '0',
};

const securitySection = {
  backgroundColor: '#f0f0f0',
  padding: '30px 40px',
  textAlign: 'center' as const,
};

const securityText = {
  color: '#666666',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '0 0 10px 0',
};

const securitySubtext = {
  color: '#999999',
  fontSize: '13px',
  margin: '0',
};

const alternativeSection = {
  padding: '30px 40px',
  textAlign: 'center' as const,
};

const alternativeText = {
  color: '#666666',
  fontSize: '16px',
  margin: '0 0 15px 0',
};

const link = {
  color: '#667eea',
  fontSize: '14px',
  textDecoration: 'underline',
  wordBreak: 'break-all' as const,
};

const footer = {
  backgroundColor: '#1a1a1a',
  padding: '40px',
  textAlign: 'center' as const,
};

const footerTitle = {
  color: '#ffffff',
  fontSize: '20px',
  fontWeight: '600',
  margin: '0 0 10px 0',
};

const footerSubtitle = {
  color: '#cccccc',
  fontSize: '14px',
  margin: '0 0 20px 0',
};

const socialLinks = {
  margin: '0 0 20px 0',
};

const socialLink = {
  color: '#cccccc',
  fontSize: '14px',
  margin: '0 10px',
  textDecoration: 'none',
};

const separator = {
  color: '#666666',
  display: 'inline',
  margin: '0 5px',
};

const legal = {
  color: '#999999',
  fontSize: '12px',
  lineHeight: '1.5',
  margin: '20px 0 0 0',
};

const legalLink = {
  color: '#999999',
  textDecoration: 'underline',
};

export default WelcomeEmailWithDemo;