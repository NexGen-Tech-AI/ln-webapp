import { Resend } from 'resend';
import { UpdateEmail } from '@/emails/UpdateEmail';
import { NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { 
      email, 
      userName, 
      updateTitle, 
      updateContent, 
      features, 
      ctaText, 
      ctaUrl 
    } = await request.json();

    if (!email || !userName || !updateTitle || !updateContent) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { data, error } = await resend.emails.send({
      from: 'LifeNavigator <updates@lifenavigator.tech>',
      to: [email],
      subject: updateTitle,
      react: UpdateEmail({ 
        userName, 
        updateTitle, 
        updateContent, 
        features, 
        ctaText, 
        ctaUrl 
      }),
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Failed to send update email:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}