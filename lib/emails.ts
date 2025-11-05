import { getAppDomain } from "@/lib/env-config";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = "notificaciones@devfest.raandino.dev";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  tags?: Record<string, string>; // For tracking
}

async function sendEmail({ to, subject, html, tags }: SendEmailParams) {
  if (!RESEND_API_KEY) {
    console.warn("[emails] RESEND_API_KEY not configured, skipping email");
    return { success: false, error: "Email not configured" };
  }

  console.log(`[emails] Attempting to send email to: ${to}, subject: ${subject}`);

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to,
        subject,
        html,
        ...(tags && { tags }), // Include tags if provided
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("[emails] Failed to send email:", error);
      return { success: false, error };
    }

    const data = await response.json();
    console.log("[emails] Email sent successfully:", data);
    return { success: true, data };
  } catch (error) {
    console.error("[emails] Error sending email:", error);
    return { success: false, error };
  }
}

interface ConnectionRequestEmailParams {
  recipientEmail: string;
  requesterName: string;
  requesterHeadline?: string | null;
  requesterCompany?: string | null;
  requesterSlug: string;
}

export async function sendConnectionRequestEmail({
  recipientEmail,
  requesterName,
  requesterHeadline,
  requesterCompany,
  requesterSlug,
}: ConnectionRequestEmailParams) {
  const appDomain = getAppDomain();
  const profileUrl = `https://${appDomain}/perfil/${requesterSlug}`;
  const connectionsUrl = `https://${appDomain}/conexiones?tab=pendientes`;

  const subtitle = [requesterHeadline, requesterCompany]
    .filter(Boolean)
    .join(" • ");

  const html = `
<!DOCTYPE html>
<html lang="es-419" dir="ltr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nueva solicitud de conexión — DevFest Managua 2025</title>
  <link href="https://fonts.googleapis.com/css?family=Open+Sans:400,600,700" rel="stylesheet" type="text/css">
  <style type="text/css">
    body {
      background-color: #F6F7F9;
      margin: 0;
      padding: 0;
      font-family: 'Open Sans', Arial, sans-serif !important;
      color: #202124;
    }
    a {
      color: #1A73E8;
      text-decoration: none;
    }
    .button {
      background-color: #1A73E8;
      color: #fff;
      padding: 14px 22px;
      border-radius: 6px;
      text-decoration: none;
      font-weight: 600;
      font-size: 16px;
      display: inline-block;
    }
    .footer {
      color: #7E8890;
      font-size: 13px;
      text-align: center;
      padding: 30px 0;
    }
  </style>
</head>
<body>
  <table width="100%" border="0" cellspacing="0" cellpadding="15">
    <tr>
      <td align="center">
        <table width="600" border="0" cellpadding="0" cellspacing="0" style="background-color: #fff; border-radius: 8px; overflow: hidden;">
          <tr>
            <td align="center" style="padding: 0;">
              <a href="https://gdg.community.dev/gdg-managua/" style="text-decoration: none; display: block;">
                <img src="https://rrgrmalmwjaxtswrabbq.supabase.co/storage/v1/object/public/avatars/emails%20assets/email%20header.jpg" alt="DevFest Managua 2025" style="width: 100%; max-width: 600px; height: auto; display: block;" border="0">
              </a>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding: 10px 40px 0;">
              <h2 style="font-size: 22px; color: #202124; font-weight: 700; margin-bottom: 10px;">
                ¡${requesterName} quiere conectar contigo! 🤝
              </h2>
              <p style="font-size: 16px; line-height: 24px; color: #5F6368; margin-top: 10px;">
                <strong>${requesterName}</strong> te ha enviado una solicitud de conexión en la App de Networking del DevFest Managua 2025.
              </p>
              ${subtitle ? `<p style="font-size: 14px; line-height: 22px; color: #7E8890; margin-top: 8px;">${subtitle}</p>` : ""}
            </td>
          </tr>

          <tr>
            <td align="center" style="padding: 30px;">
              <a href="${connectionsUrl}" class="button" target="_blank">
                Ver solicitud y responder
              </a>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding: 0 40px 20px;">
              <p style="font-size: 14px; color: #5F6368; line-height: 22px; margin-bottom: 15px;">
                También puedes ver el perfil completo de ${requesterName}:
              </p>
              <a href="${profileUrl}" style="color: #1A73E8; font-size: 14px; font-weight: 600;">
                Ver perfil →
              </a>
            </td>
          </tr>

          <tr>
            <td align="center" style="background-color: #F6F7F9; padding: 25px 20px;">
              <p style="font-size: 14px; color: #5F6368; margin: 0 0 10px;">
                💡 Puedes aceptar o rechazar esta solicitud desde tu panel de conexiones.
              </p>
              <p style="font-size: 13px; color: #7E8890; margin: 0;">
                App creada por la comunidad de <strong>Google Developer Groups Managua</strong> para el DevFest Managua 2025.
              </p>
            </td>
          </tr>
        </table>

        <div class="footer">
          <a href="https://gdg.community.dev/gdg-managua/" style="display: block;">
            <img src="https://rrgrmalmwjaxtswrabbq.supabase.co/storage/v1/object/public/avatars/emails%20assets/email%20footer.png" alt="GDG Managua" style="max-width: 200px; width: auto; height: auto; display: block; margin: 0 auto;" border="0">
          </a>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return sendEmail({
    to: recipientEmail,
    subject: `${requesterName} te envió una solicitud de conexión`,
    html,
    tags: {
      category: 'connection_request',
    },
  });
}

interface ConnectionAcceptedEmailParams {
  recipientEmail: string;
  accepterName: string;
  accepterHeadline?: string | null;
  accepterCompany?: string | null;
  accepterSlug: string;
}

export async function sendConnectionAcceptedEmail({
  recipientEmail,
  accepterName,
  accepterHeadline,
  accepterCompany,
  accepterSlug,
}: ConnectionAcceptedEmailParams) {
  const appDomain = getAppDomain();
  const profileUrl = `https://${appDomain}/perfil/${accepterSlug}`;
  const connectionsUrl = `https://${appDomain}/conexiones`;

  const subtitle = [accepterHeadline, accepterCompany]
    .filter(Boolean)
    .join(" • ");

  const html = `
<!DOCTYPE html>
<html lang="es-419" dir="ltr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>¡Conexión aceptada! — DevFest Managua 2025</title>
  <link href="https://fonts.googleapis.com/css?family=Open+Sans:400,600,700" rel="stylesheet" type="text/css">
  <style type="text/css">
    body {
      background-color: #F6F7F9;
      margin: 0;
      padding: 0;
      font-family: 'Open Sans', Arial, sans-serif !important;
      color: #202124;
    }
    a {
      color: #1A73E8;
      text-decoration: none;
    }
    .button {
      background-color: #1A73E8;
      color: #fff;
      padding: 14px 22px;
      border-radius: 6px;
      text-decoration: none;
      font-weight: 600;
      font-size: 16px;
      display: inline-block;
    }
    .footer {
      color: #7E8890;
      font-size: 13px;
      text-align: center;
      padding: 30px 0;
    }
  </style>
</head>
<body>
  <table width="100%" border="0" cellspacing="0" cellpadding="15">
    <tr>
      <td align="center">
        <table width="600" border="0" cellpadding="0" cellspacing="0" style="background-color: #fff; border-radius: 8px; overflow: hidden;">
          <tr>
            <td align="center" style="padding: 0;">
              <a href="https://gdg.community.dev/gdg-managua/" style="text-decoration: none; display: block;">
                <img src="https://rrgrmalmwjaxtswrabbq.supabase.co/storage/v1/object/public/avatars/emails%20assets/email%20header.jpg" alt="DevFest Managua 2025" style="width: 100%; max-width: 600px; height: auto; display: block;" border="0">
              </a>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding: 10px 40px 0;">
              <h2 style="font-size: 22px; color: #202124; font-weight: 700; margin-bottom: 10px;">
                ¡${accepterName} aceptó tu solicitud! 🎉
              </h2>
              <p style="font-size: 16px; line-height: 24px; color: #5F6368; margin-top: 10px;">
                <strong>${accepterName}</strong> ha aceptado tu solicitud de conexión en la App de Networking del DevFest Managua 2025.
              </p>
              ${subtitle ? `<p style="font-size: 14px; line-height: 22px; color: #7E8890; margin-top: 8px;">${subtitle}</p>` : ""}
            </td>
          </tr>

          <tr>
            <td align="center" style="padding: 30px;">
              <a href="${connectionsUrl}" class="button" target="_blank">
                Ver mis conexiones
              </a>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding: 0 40px 20px;">
              <p style="font-size: 14px; color: #5F6368; line-height: 22px; margin-bottom: 15px;">
                Ahora puedes ver su información de contacto completa:
              </p>
              <a href="${profileUrl}" style="color: #1A73E8; font-size: 14px; font-weight: 600;">
                Ver perfil de ${accepterName} →
              </a>
            </td>
          </tr>

          <tr>
            <td align="center" style="background-color: #F6F7F9; padding: 25px 20px;">
              <p style="font-size: 14px; color: #5F6368; margin: 0 0 10px;">
                💡 Puedes agregar notas sobre esta conexión desde tu panel de conexiones.
              </p>
              <p style="font-size: 13px; color: #7E8890; margin: 0;">
                App creada por la comunidad de <strong>Google Developer Groups Managua</strong> para el DevFest Managua 2025.
              </p>
            </td>
          </tr>
        </table>

        <div class="footer">
          <a href="https://gdg.community.dev/gdg-managua/" style="display: block;">
            <img src="https://rrgrmalmwjaxtswrabbq.supabase.co/storage/v1/object/public/avatars/emails%20assets/email%20footer.png" alt="GDG Managua" style="max-width: 200px; width: auto; height: auto; display: block; margin: 0 auto;" border="0">
          </a>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return sendEmail({
    to: recipientEmail,
    subject: `${accepterName} aceptó tu solicitud de conexión`,
    html,
    tags: {
      category: 'connection_accepted',
    },
  });
}

interface InvitationEmailParams {
  recipientEmail: string;
  inviterName: string;
  invitationUrl: string;
  eventName: string;
}

export async function sendInvitationEmail({
  recipientEmail,
  inviterName,
  invitationUrl,
  eventName,
}: InvitationEmailParams) {
  const html = `
<!DOCTYPE html>
<html lang="es-419" dir="ltr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invitación a ${eventName}</title>
  <link href="https://fonts.googleapis.com/css?family=Open+Sans:400,600,700" rel="stylesheet" type="text/css">
  <style type="text/css">
    body {
      background-color: #F6F7F9;
      margin: 0;
      padding: 0;
      font-family: 'Open Sans', Arial, sans-serif !important;
      color: #202124;
    }
    a {
      color: #1A73E8;
      text-decoration: none;
    }
    .button {
      background-color: #1A73E8;
      color: #fff;
      padding: 14px 22px;
      border-radius: 6px;
      text-decoration: none;
      font-weight: 600;
      font-size: 16px;
      display: inline-block;
    }
    .footer {
      color: #7E8890;
      font-size: 13px;
      text-align: center;
      padding: 30px 0;
    }
  </style>
</head>
<body>
  <table width="100%" border="0" cellspacing="0" cellpadding="15">
    <tr>
      <td align="center">
        <table width="600" border="0" cellpadding="0" cellspacing="0" style="background-color: #fff; border-radius: 8px; overflow: hidden;">
          <tr>
            <td align="center" style="padding: 0;">
              <a href="https://gdg.community.dev/gdg-managua/" style="text-decoration: none; display: block;">
                <img src="https://rrgrmalmwjaxtswrabbq.supabase.co/storage/v1/object/public/avatars/emails%20assets/email%20header.jpg" alt="${eventName}" style="width: 100%; max-width: 600px; height: auto; display: block;" border="0">
              </a>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding: 10px 40px 0;">
              <h2 style="font-size: 22px; color: #202124; font-weight: 700; margin-bottom: 10px;">
                ¡Has sido invitado a ${eventName}! 🎉
              </h2>
              <p style="font-size: 16px; line-height: 24px; color: #5F6368; margin-top: 10px;">
                <strong>${inviterName}</strong> te ha invitado a unirte a la App de Networking del ${eventName}.
              </p>
              <p style="font-size: 14px; line-height: 22px; color: #7E8890; margin-top: 8px;">
                Conecta con otros asistentes, comparte tu perfil profesional y expande tu red de contactos.
              </p>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding: 30px;">
              <a href="${invitationUrl}" class="button" target="_blank">
                Aceptar invitación
              </a>
            </td>
          </tr>

          <tr>
            <td align="center" style="background-color: #F6F7F9; padding: 25px 20px;">
              <p style="font-size: 14px; color: #5F6368; margin: 0 0 10px;">
                💡 Esta invitación expira en 7 días.
              </p>
              <p style="font-size: 13px; color: #7E8890; margin: 0;">
                App creada por la comunidad de <strong>Google Developer Groups Managua</strong> para el ${eventName}.
              </p>
            </td>
          </tr>
        </table>

        <div class="footer">
          <a href="https://gdg.community.dev/gdg-managua/" style="display: block;">
            <img src="https://rrgrmalmwjaxtswrabbq.supabase.co/storage/v1/object/public/avatars/emails%20assets/email%20footer.png" alt="GDG Managua" style="max-width: 200px; width: auto; height: auto; display: block; margin: 0 auto;" border="0">
          </a>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return sendEmail({
    to: recipientEmail,
    subject: `${inviterName} te invitó a ${eventName}`,
    html,
    tags: {
      category: 'invitation',
    },
  });
}
