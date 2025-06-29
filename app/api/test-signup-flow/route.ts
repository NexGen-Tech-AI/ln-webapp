import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const testEmail = `test-${Date.now()}@example.com`
    
    console.log('Testing signup flow with:', {
      email: testEmail,
      profileData: body
    })

    // 1. Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: testEmail,
      password: 'testpassword123',
      email_confirm: true
    })

    if (authError) {
      return NextResponse.json({ 
        step: 'auth_create',
        error: authError.message 
      }, { status: 400 })
    }

    console.log('Auth user created:', authData.user?.id)

    // 2. Test upsert to public.users
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .upsert({
        id: authData.user!.id,
        email: testEmail,
        name: body.name || 'Test User',
        profession: body.profession || 'Test Profession',
        company: body.company || 'Test Company',
        interests: body.interests || ['💰 Financial Planning'],
        tier_preference: body.tierPreference || 'free',
        user_type: 'waitlist',
        referral_code: 'TEST' + Date.now().toString().slice(-4),
        position: 999,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (userError) {
      // Cleanup auth user on failure
      await supabaseAdmin.auth.admin.deleteUser(authData.user!.id)
      return NextResponse.json({ 
        step: 'profile_create',
        error: userError.message,
        details: userError
      }, { status: 400 })
    }

    // 3. Verify the data was saved
    const { data: verifyData, error: verifyError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', authData.user!.id)
      .single()

    // 4. Cleanup test user
    await supabaseAdmin.auth.admin.deleteUser(authData.user!.id)
    await supabaseAdmin.from('users').delete().eq('id', authData.user!.id)

    return NextResponse.json({
      success: true,
      authUserId: authData.user!.id,
      profileCreated: !!userData,
      profileData: userData,
      verifiedData: verifyData,
      dataIntact: {
        name: verifyData?.name === (body.name || 'Test User'),
        profession: verifyData?.profession === (body.profession || 'Test Profession'),
        company: verifyData?.company === (body.company || 'Test Company'),
        interests: verifyData?.interests?.length > 0
      }
    })

  } catch (error) {
    console.error('Test signup error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Test failed'
    }, { status: 500 })
  }
}