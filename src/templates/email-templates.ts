export interface TemplateData {
  otp: string;
  email: string;
  context: string;
  expiresIn: string;
  companyName?: string | undefined;
  supportEmail?: string | undefined;
}

export class EmailTemplates {
  static getDefaultSubject(): string {
    return 'Your Verification Code';
  }

  static getDefaultHtml(_data: TemplateData): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verification Code</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .container {
            background-color: #ffffff;
            border-radius: 8px;
            padding: 40px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
        }
        .otp-code {
            background-color: #f3f4f6;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin: 30px 0;
            font-family: 'Courier New', monospace;
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 4px;
            color: #1f2937;
        }
        .expiry {
            background-color: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
            color: #92400e;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            font-size: 14px;
            color: #6b7280;
        }
        .warning {
            background-color: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
            color: #991b1b;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">{{companyName}}</div>
            <h1>Verification Code</h1>
        </div>
        
        <p>Hello,</p>
        
        <p>You requested a verification code for your account. Here's your secure code:</p>
        
        <div class="otp-code">{{otp}}</div>
        
        <div class="expiry">
            <strong>⚠️ Important:</strong> This code will expire in {{expiresIn}}.
        </div>
        
        <div class="warning">
            <strong>Security Notice:</strong>
            <ul>
                <li>Never share this code with anyone</li>
                <li>Our team will never ask for this code</li>
                <li>If you didn't request this code, please ignore this email</li>
            </ul>
        </div>
        
        <p>If you have any questions, please contact us at <a href="mailto:{{supportEmail}}">{{supportEmail}}</a>.</p>
        
        <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>&copy; {{companyName}}. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;
  }

  static getDefaultText(_data: TemplateData): string {
    return `
{{companyName}} - Verification Code

Hello,

You requested a verification code for your account. Here's your secure code:

{{otp}}

IMPORTANT: This code will expire in {{expiresIn}}.

SECURITY NOTICE:
- Never share this code with anyone
- Our team will never ask for this code
- If you didn't request this code, please ignore this email

If you have any questions, please contact us at {{supportEmail}}.

---
This is an automated message. Please do not reply to this email.
© {{companyName}}. All rights reserved.`;
  }

  static renderTemplate(template: string, data: TemplateData): string {
    return template
      .replace(/\{\{otp\}\}/g, data.otp)
      .replace(/\{\{email\}\}/g, data.email)
      .replace(/\{\{context\}\}/g, data.context)
      .replace(/\{\{expiresIn\}\}/g, data.expiresIn)
      .replace(/\{\{companyName\}\}/g, data.companyName || 'Your Company')
      .replace(/\{\{supportEmail\}\}/g, data.supportEmail || 'support@yourcompany.com');
  }
}
