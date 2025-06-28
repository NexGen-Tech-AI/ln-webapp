import { Resend } from 'resend';
import { DemoAccessEmail } from '@/emails/DemoAccessEmail';
import { NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { email, userName, position } = await request.json();

    if (!email || !userName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { data, error } = await resend.emails.send({
      from: 'LifeNavigator <updates@lifenavigator.tech>',
      to: [email],
      subject: '🌟 Your Exclusive LifeNavigator Demo Access is Ready!',
      react: DemoAccessEmail({ 
        userName, 
        position: position || 42 
      }),
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Failed to send demo access email:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}