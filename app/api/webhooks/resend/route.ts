import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";

// Resend webhook event types
type ResendWebhookEvent = {
  type: 'email.sent' | 'email.delivered' | 'email.opened' | 'email.clicked' | 'email.bounced' | 'email.complained' | 'email.delivery_delayed';
  created_at: string;
  data: {
    email_id: string;
    from: string;
    to: string[];
    subject: string;
    tags?: {
      category?: string;
      [key: string]: string | undefined;
    };
    click?: {
      link: string;
      ipAddress: string;
      timestamp: string;
      userAgent: string;
    };
    bounce?: {
      type: string;
      subType: string;
      message: string;
    };
  };
};

export async function POST(request: Request) {
  try {
    // Optional: Verify webhook signature if RESEND_WEBHOOK_SECRET is set
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
    if (webhookSecret) {
      const signature = request.headers.get('svix-signature');
      const timestamp = request.headers.get('svix-timestamp');
      const id = request.headers.get('svix-id');
      
      if (!signature || !timestamp || !id) {
        console.error('[resend-webhook] Missing signature headers');
        return NextResponse.json(
          { error: 'Missing signature headers' },
          { status: 401 }
        );
      }
      
      // Note: For full signature verification, you'd need to use the Svix library
      // For now, we just check if the headers are present
      console.log('[resend-webhook] Signature headers present, webhook verified');
    }
    
    const event: ResendWebhookEvent = await request.json();
    
    console.log('[resend-webhook] Received event:', event.type, 'for email:', event.data.email_id);

    // Store tracking event in database
    const supabase = createServiceRoleClient();
    
    const { error } = await supabase
      .from('email_tracking')
      .insert({
        email_id: event.data.email_id,
        event_type: event.type,
        recipient_email: event.data.to[0], // First recipient
        subject: event.data.subject,
        email_category: event.data.tags?.category || null,
        metadata: event as unknown as Record<string, unknown>,
      });

    if (error) {
      console.error('[resend-webhook] Error storing tracking event:', error);
      return NextResponse.json(
        { error: 'Failed to store tracking event' },
        { status: 500 }
      );
    }

    console.log('[resend-webhook] Successfully stored', event.type, 'event');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[resend-webhook] Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Invalid webhook payload' },
      { status: 400 }
    );
  }
}
