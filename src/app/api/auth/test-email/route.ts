import { NextRequest, NextResponse } from 'next/server';
import { sendWelcomeEmail } from '@/lib/email/sendgrid';

export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    console.log('Testing email send to:', email);
    console.log('SendGrid API Key configured:', !!process.env.SENDGRID_API_KEY);
    console.log('SendGrid From Email:', process.env.SENDGRID_FROM_EMAIL);

    // Test sending an email
    const result = await sendWelcomeEmail(email, name || 'Test User', 'test-token-123');
    
    return NextResponse.json({
      success: result,
      message: result ? 'Email sent successfully' : 'Email failed to send',
      config: {
        hasApiKey: !!process.env.SENDGRID_API_KEY,
        fromEmail: process.env.SENDGRID_FROM_EMAIL
      }
    });
  } catch (error) {
    console.error('Email test error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      errorDetails: error.toString(),
      stack: error.stack,
      config: {
        hasApiKey: !!process.env.SENDGRID_API_KEY,
        fromEmail: process.env.SENDGRID_FROM_EMAIL
      }
    }, { status: 500 });
  }
}