export const generateWelcomeEmail = (firstName: string): string => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to KirkiData</title>
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
        
        /* Responsive design */
        @media only screen and (max-width: 600px) {
          .email-container {
            padding: 10px !important;
          }
          .content {
            padding: 20px !important;
          }
        }
      </style>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif;">
      <div class="email-container" style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #FAFAFA;">
        <div class="header" style="text-align: center; margin-bottom: 30px; background-color: #1A237E; padding: 30px; border-radius: 8px 8px 0 0;">
          <h2 style="color: #FAFAFA; margin: 0; font-size: 28px;">Welcome to KirkiData!</h2>
        </div>
        
        <div class="content" style="background-color: #FFFFFF; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <p class="text-body" style="margin: 0 0 20px 0; color: #212121; font-size: 18px; line-height: 1.6;">Hi <strong class="text-primary" style="color: #1A237E;">${firstName}</strong>,</p>
          <p class="text-body" style="margin: 0 0 20px 0; color: #212121; font-size: 16px; line-height: 1.6;">Thank you for joining KirkiData! We're excited to have you on board.</p>
          <p class="text-body" style="margin: 0 0 20px 0; color: #212121; font-size: 16px; line-height: 1.6;">Your account has been created successfully. You can now log in and start using our services.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <div style="background-color: #8BC34A; color: #FFFFFF; padding: 15px 30px; border-radius: 25px; display: inline-block; font-size: 16px; font-weight: bold; text-decoration: none;">
              🚀 Get Started
            </div>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 20px;">
          <p class="text-muted" style="color: #9E9E9E; font-size: 14px; margin: 0;">If you have any questions, please contact our support team.</p>
          <p class="text-muted" style="color: #9E9E9E; font-size: 14px; margin: 5px 0 0 0;">Best regards,<br><strong class="text-primary" style="color: #1A237E;">The KirkiData Team</strong></p>
        </div>
      </div>
    </body>
    </html>
  `;
};
