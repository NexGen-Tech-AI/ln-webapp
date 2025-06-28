import { Resend } from 'resend';
import { WelcomeEmail } from '@/emails/WelcomeEmail';
import { NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { email, userName, verificationUrl } = await request.json();

    if (!email || !userName || !verificationUrl) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { data, error } = await resend.emails.send({
      from: 'LifeNavigator <welcome@lifenavigator.tech>',
      to: [email],
      subject: `Welcome to LifeNavigator, ${userName}! 🎉`,
      react: WelcomeEmail({ userName, verificationUrl }),
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}