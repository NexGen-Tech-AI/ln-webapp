import * as React from 'react';
import {
  Button,
  Heading,
  Link,
  Section,
  Text,
} from '@react-email/components';
import { BaseEmail, styles } from './templates/BaseEmail';

interface UpdateEmailProps {
  userName: string;
  updateTitle: string;
  updateContent: string;
  features?: Array<{
    emoji: string;
    title: string;
    description: string;
  }>;
  ctaText?: string;
  ctaUrl?: string;
}

export const UpdateEmail = ({
  userName = 'there',
  updateTitle = 'New Features in LifeNavigator',
  updateContent = 'We have exciting updates for you!',
  features = [],
  ctaText = 'Explore Now',
  ctaUrl = 'https://lifenavigator.tech/dashboard',
}: UpdateEmailProps) => {
  const previewText = `${updateTitle} - LifeNavigator Update`;

  return (
    <BaseEmail preview={previewText}>
      {/* Header with gradient */}
      <Section style={header}>
        <div style={logoContainer}>
          <div style={logoCircle}>
            <Text style={logoEmoji}>🧭</Text>
          </div>
        </div>
        <Heading style={h1}>Product Update</Heading>
        <Text style={subtitle}>What's New in LifeNavigator</Text>
      </Section>

      {/* Update message */}
      <Section style={content}>
        <Heading as="h2" style={h2}>
          Hey {userName}! 👋
        </Heading>
        <Heading as="h3" style={h3}>
          {updateTitle}
        </Heading>
        <Text style={paragraph}>
          {updateContent}
        </Text>
      </Section>

      {/* Features list if provided */}
      {features.length > 0 && (
        <Section style={featuresSection}>
          <Heading as="h3" style={featureHeader}>
            New Features & Improvements
          </Heading>
          {features.map((feature, index) => (
            <div key={index} style={featureItem}>
              <span style={featureEmoji}>{feature.emoji}</span>
              <div style={featureTextContainer}>
                <Text style={featureTitle}>{feature.title}</Text>
                <Text style={featureDescription}>{feature.description}</Text>
              </div>
            </div>
          ))}
        </Section>
      )}

      {/* CTA Button */}
      {ctaUrl && (
        <Section style={buttonContainer}>
          <Button style={styles.button} href={ctaUrl}>
            {ctaText}
          </Button>
        </Section>
      )}

      {/* Additional info */}
      <Section style={infoSection}>
        <Text style={infoText}>
          Your feedback shapes LifeNavigator. If you have any suggestions or questions, 
          we'd love to hear from you!
        </Text>
        <Link href="mailto:support@lifenavigator.tech" style={styles.link}>
          Contact Support
        </Link>
      </Section>
    </BaseEmail>
  );
};

// Styles
const header = {
  ...styles.header,
  padding: '40px 40px',
};

const logoContainer = {
  marginBottom: '20px',
};

const logoCircle = {
  background: 'rgba(255, 255, 255, 0.2)',
  borderRadius: '50%',
  display: 'inline-block',
  padding: '15px',
  backdropFilter: 'blur(10px)',
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
};

const subtitle = {
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '300',
  margin: '10px 0 0 0',
  opacity: 0.9,
};

const content = {
  padding: '40px 40px 20px 40px',
};

const h2 = {
  color: '#1a1a1a',
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '1.2',
  margin: '0 0 10px 0',
};

const h3 = {
  color: '#333333',
  fontSize: '20px',
  fontWeight: '600',
  margin: '0 0 15px 0',
};

const paragraph = {
  color: '#666666',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 20px 0',
};

const featuresSection = {
  backgroundColor: '#f8f9fa',
  padding: '30px 40px',
  margin: '20px 0',
};

const featureHeader = {
  color: '#1a1a1a',
  fontSize: '18px',
  fontWeight: '600',
  margin: '0 0 20px 0',
};

const featureItem = {
  display: 'flex',
  alignItems: 'flex-start',
  marginBottom: '20px',
};

const featureEmoji = {
  fontSize: '24px',
  marginRight: '15px',
  flexShrink: 0,
};

const featureTextContainer = {
  flex: 1,
};

const featureTitle = {
  color: '#333333',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 5px 0',
};

const featureDescription = {
  color: '#666666',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '0',
};

const buttonContainer = {
  padding: '20px 40px 30px 40px',
  textAlign: 'center' as const,
};

const infoSection = {
  padding: '20px 40px 40px 40px',
  textAlign: 'center' as const,
  borderTop: '1px solid #eeeeee',
};

const infoText = {
  color: '#666666',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0 0 15px 0',
};

export default UpdateEmail;