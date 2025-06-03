import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { emailTemplateService, updateEmailTemplate } from '@/services/email-templates'
import { z } from 'zod'

const sendEmailSchema = z.object({
  type: z.enum(['feature', 'announcement', 'milestone', 'custom']),
  subject: z.string().min(1),
  content: z.string().min(1),
  ctaText: z.string().optional(),
  ctaUrl: z.string().url().optional(),
  segment: z.string(),
  scheduledFor: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = sendEmailSchema.parse(body)

    // Get recipients based on segment
    let query = supabaseAdmin
      .from('users')
      .select('id, email, name, referral_count, position')
      .eq('email_updates', true)

    switch (validatedData.segment) {
      case 'pilot':
        query = query.eq('user_type', 'pilot')
        break
      case 'waitlist':
        query = query.eq('user_type', 'waitlist')
        break
      case 'verified':
        query = query.eq('service_verified', true)
        break
      case 'active':
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        query = query.gte('last_login', thirtyDaysAgo.toISOString())
        break
    }

    const { data: recipients, error } = await query

    if (error) throw error

    if (!recipients || recipients.length === 0) {
      return NextResponse.json(
        { error: 'No recipients found for selected segment' },
        { status: 400 }
      )
    }

    // Create campaign record
    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from('email_campaigns')
      .insert({
        name: validatedData.subject,
        subject: validatedData.subject,
        content_html: validatedData.content,
        segment_id: null, // We're using dynamic segments for now
        status: validatedData.scheduledFor ? 'scheduled' : 'sending',
        scheduled_for: validatedData.scheduledFor,
        sent_count: recipients.length,
      })
      .select()
      .single()

    if (campaignError) throw campaignError

    // If scheduled, add to queue
    if (validatedData.scheduledFor) {
      await supabaseAdmin
        .from('email_queue')
        .insert(
          recipients.map(recipient => ({
            to_email: recipient.email,
            subject: validatedData.subject,
            html: updateEmailTemplate(
              validatedData.subject,
              validatedData.content
                .replace(/{user_name}/g, recipient.name || 'there')
                .replace(/{referral_count}/g, recipient.referral_count.toString())
                .replace(/{position}/g, recipient.position.toString()),
              validatedData.ctaText,
              validatedData.ctaUrl,
              validatedData.type
            ),
            status: 'pending',
          }))
        )

      return NextResponse.json({ 
        success: true, 
        message: `Email scheduled for ${recipients.length} recipients`,
        campaignId: campaign.id
      })
    }

    // Send immediately
    const emailPromises = recipients.map(recipient => 
      emailTemplateService.sendUpdate(
        [recipient.email],
        validatedData.subject,
        validatedData.content
          .replace(/{user_name}/g, recipient.name || 'there')
          .replace(/{referral_count}/g, recipient.referral_count.toString())
          .replace(/{position}/g, recipient.position.toString()),
        {
          ctaText: validatedData.ctaText,
          ctaUrl: validatedData.ctaUrl,
          type: validatedData.type,
        }
      )
    )

    // Send emails in batches of 10 to avoid rate limits
    const batchSize = 10
    for (let i = 0; i < emailPromises.length; i += batchSize) {
      const batch = emailPromises.slice(i, i + batchSize)
      await Promise.all(batch)
      
      // Small delay between batches
      if (i + batchSize < emailPromises.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    // Update campaign status
    await supabaseAdmin
      .from('email_campaigns')
      .update({ 
        status: 'sent',
        sent_at: new Date().toISOString()
      })
      .eq('id', campaign.id)

    return NextResponse.json({ 
      success: true, 
      message: `Email sent to ${recipients.length} recipients`,
      campaignId: campaign.id
    })
  } catch (error) {
    console.error('Send email error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    )
  }
}