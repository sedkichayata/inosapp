// OTP Email Service using Resend

const FROM_EMAIL = 'INOS <onboarding@resend.dev>';

export interface SendOTPResponse {
  success: boolean;
  code?: string;
  error?: string;
}

export const generateOTPCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const sendOTPEmail = async (
  email: string,
  code: string
): Promise<SendOTPResponse> => {
  // Get API key at runtime
  const apiKey = process.env.EXPO_PUBLIC_RESEND_API_KEY;

  console.log('=== INOS OTP Email Service ===');
  console.log('Sending OTP to:', email);
  console.log('API Key configured:', !!apiKey);
  console.log('API Key first chars:', apiKey ? apiKey.substring(0, 6) + '...' : 'none');

  if (!apiKey) {
    console.warn('RESEND_API_KEY not configured, using mock OTP');
    console.log('Mock OTP code:', code);
    return { success: true, code };
  }

  try {
    const requestBody = {
      from: FROM_EMAIL,
      to: [email],
      subject: `${code} - Votre code de vérification INOS`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #0A0A0B; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0A0A0B; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="100%" style="max-width: 400px; background-color: #141416; border-radius: 24px; border: 1px solid #2A2A2E; overflow: hidden;">
                  <tr>
                    <td style="padding: 40px 30px 20px; text-align: center;">
                      <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #FFFFFF; letter-spacing: 4px;">INOS</h1>
                      <p style="margin: 8px 0 0; font-size: 12px; color: #C9A86C; letter-spacing: 2px;">SKIN INTELLIGENCE</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 20px 30px 40px;">
                      <p style="margin: 0 0 24px; font-size: 16px; color: #888888; text-align: center; line-height: 1.5;">
                        Voici votre code de vérification :
                      </p>
                      <div style="background-color: #1A1A1E; border: 2px solid #C9A86C; border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 24px;">
                        <span style="font-size: 36px; font-weight: bold; color: #C9A86C; letter-spacing: 8px;">${code}</span>
                      </div>
                      <p style="margin: 0; font-size: 14px; color: #666666; text-align: center; line-height: 1.5;">
                        Ce code expire dans 10 minutes.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 20px 30px; background-color: #0A0A0B; border-top: 1px solid #2A2A2E;">
                      <p style="margin: 0; font-size: 12px; color: #444444; text-align: center;">
                        INOS - Skin Intelligence
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
      text: `Votre code de vérification INOS est : ${code}. Ce code expire dans 10 minutes.`,
    };

    console.log('Sending request to Resend API...');

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const responseText = await response.text();
    console.log('Resend API status:', response.status);
    console.log('Resend API response:', responseText);

    if (!response.ok) {
      let errorMessage = 'Erreur lors de l\'envoi de l\'email';
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.message || errorData.error || errorMessage;

        if (errorData.statusCode === 401 || response.status === 401) {
          errorMessage = 'Clé API Resend invalide';
        } else if (errorData.statusCode === 422 || response.status === 422) {
          errorMessage = errorData.message || 'Email invalide';
        }
      } catch {
        errorMessage = responseText || errorMessage;
      }

      console.error('Resend API error:', errorMessage);
      return { success: false, error: errorMessage };
    }

    const data = JSON.parse(responseText);
    console.log('Email sent successfully! ID:', data.id);

    return { success: true, code };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    console.error('Failed to send OTP email:', errorMessage);
    return {
      success: false,
      error: `Impossible d'envoyer l'email: ${errorMessage}`,
    };
  }
};
