import * as React from 'react';
import {
  Body,
  Container,
  Head,
  Html,
  Link,
  Preview,
  Row,
  Section,
  Text,
  Column,
} from '@react-email/components';

interface BaseEmailProps {
  preview: string;
  children: React.ReactNode;
}

export const BaseEmail = ({ preview, children }: BaseEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          {children}
          
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

// Shared styles
export const styles = {
  main: {
    backgroundColor: '#f5f5f5',
    fontFamily:
      '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif',
  },
  container: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07)',
    margin: '40px auto',
    overflow: 'hidden',
    width: '600px',
    maxWidth: '100%',
  },
  header: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '60px 40px',
    textAlign: 'center' as const,
  },
  button: {
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
  },
  link: {
    color: '#667eea',
    fontSize: '14px',
    textDecoration: 'underline',
  },
};

// Styles for the base template
const main = styles.main;
const container = styles.container;

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