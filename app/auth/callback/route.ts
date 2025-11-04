import { NextResponse } from 'next/server'
// The client you created from the Server-Side Auth instructions
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const invitationToken = searchParams.get('invitation')
  // if "next" is in param, use it as the redirect URL
  let next = searchParams.get('next') ?? '/dashboard'
  
  if (!next.startsWith('/')) {
    // if "next" is not a relative URL, use the default
    next = '/dashboard'
  }

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // If there's an invitation token, handle it
      if (invitationToken) {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          // Mark invitation as accepted
          const { data: invitation } = await supabase
            .from('invitations')
            .select('*')
            .eq('token', invitationToken)
            .maybeSingle()

          if (invitation && invitation.status === 'pending') {
            await supabase
              .from('invitations')
              .update({
                status: 'accepted',
                accepted_at: new Date().toISOString(),
              })
              .eq('token', invitationToken)

            // Create or update profile
            const { data: profile } = await supabase
              .from('profiles')
              .select('id')
              .eq('id', user.id)
              .maybeSingle()

            if (!profile) {
              const fallbackName =
                (typeof user.user_metadata?.full_name === 'string' &&
                  user.user_metadata.full_name.trim()) ||
                (typeof user.user_metadata?.name === 'string' &&
                  user.user_metadata.name.trim()) ||
                (user.email ? user.email.split('@')[0] : 'Asistente')

              await supabase.from('profiles').insert({
                id: user.id,
                event_id: invitation.event_id,
                name: fallbackName,
                joined_event_at: new Date().toISOString(),
              })
            }

            // Redirect invited users directly to profile edit page
            next = '/perfil/editar'
          }
        }
      }

      const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === 'development'
      if (isLocalEnv) {
        // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
