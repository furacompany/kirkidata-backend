export const generateEmailVerificationOTP = (
  firstName: string,
  otp: string
): string => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email - KirkiData</title>
      <style>
        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
          .email-container {
            background-color: #0D1B2A !important;
          }
          .header {
            background-color: #1A237E !important;
          }
          .content {
            background-color: #1A237E !important;
            color: #FAFAFA !important;
          }
          .text-primary {
            color: #8BC34A !important;
          }
          .text-body {
            color: #FAFAFA !important;
          }
          .text-muted {
            color: #9E9E9E !important;
          }
          .otp-box {
            background-color: #2E7D32 !important;
            border: 2px solid #4CAF50 !important;
          }
          .warning-box {
            background-color: #FBC02D !important;
            color: #0D1B2A !important;
          }
        }
        
        /* Light mode (default) */
        .email-container {
          background-color: #FAFAFA;
        }
        .header {
          background-color: #1A237E;
        }
        .content {
          background-color: #FFFFFF;
          color: #212121;
        }
        .text-primary {
          color: #1A237E;
        }
        .text-body {
          color: #212121;
        }
        .text-muted {
          color: #9E9E9E;
        }
        .otp-box {
          background-color: #2E7D32;
          border: 2px solid #4CAF50;
        }
        .warning-box {
          background-color: #FBC02D;
          color: #212121;
        }
        
        /* Responsive design */
        @media only screen and (max-width: 600px) {
          .email-container {
            padding: 10px !important;
          }
          .content {
            padding: 20px !important;
          }
          .otp-box {
            font-size: 24px !important;
            letter-spacing: 4px !important;
            padding: 15px !important;
          }
        }
      </style>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif;">
      <div class="email-container" style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #FAFAFA;">
        <div class="header" style="text-align: center; margin-bottom: 30px; background-color: #1A237E; padding: 30px; border-radius: 8px 8px 0 0;">
          <h2 style="color: #FAFAFA; margin: 0; font-size: 28px;">Verify Your Email</h2>
        </div>
        
        <div class="content" style="background-color: #FFFFFF; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <p class="text-body" style="margin: 0 0 20px 0; color: #212121; font-size: 18px; line-height: 1.6;">Hi <strong class="text-primary" style="color: #1A237E;">${firstName}</strong>,</p>
          <p class="text-body" style="margin: 0 0 20px 0; color: #212121; font-size: 16px; line-height: 1.6;">Please use the verification code below to verify your email address:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <div class="otp-box" style="background-color: #2E7D32; color: #FFFFFF; padding: 20px; border-radius: 12px; display: inline-block; font-size: 32px; font-weight: bold; letter-spacing: 8px; box-shadow: 0 4px 15px rgba(46, 125, 50, 0.3); border: 2px solid #4CAF50;">
              ${otp}
            </div>
          </div>
          
          <div class="warning-box" style="background-color: #FBC02D; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; color: #212121; font-size: 14px; font-weight: bold;">⏰ This code will expire in 5 minutes</p>
          </div>
          
          <p style="margin: 20px 0 0 0; color: #9E9E9E; font-size: 14px; text-align: center;">Enter this code in the verification form to complete your email verification.</p>
        </div>
        
        <div style="text-align: center; margin-top: 20px;">
          <p class="text-muted" style="color: #9E9E9E; font-size: 14px; margin: 0;">If you didn't request this verification, please ignore this email.</p>
          <p class="text-muted" style="color: #9E9E9E; font-size: 14px; margin: 5px 0 0 0;">Best regards,<br><strong class="text-primary" style="color: #1A237E;">The KirkiData Team</strong></p>
        </div>
      </div>
    </body>
    </html>
  `;
};
