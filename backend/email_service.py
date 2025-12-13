"""
BETZ Email Service
==================
Supports SMTP (Zoho, Gmail, etc.) and SendGrid for sending invite emails.

Configuration (add to .env):
----------------------------
# For SMTP (Zoho Mail, Gmail, etc.)
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.zoho.com
SMTP_PORT=587
SMTP_EMAIL=invites@betz.com
SMTP_PASSWORD=your_app_password

# OR for SendGrid
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=invites@betz.com
"""

import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
import logging

logger = logging.getLogger(__name__)

# Email configuration from environment
EMAIL_PROVIDER = os.environ.get('EMAIL_PROVIDER', 'mock')  # 'smtp', 'sendgrid', or 'mock'
SMTP_HOST = os.environ.get('SMTP_HOST', 'smtp.zoho.com')
SMTP_PORT = int(os.environ.get('SMTP_PORT', '587'))
SMTP_EMAIL = os.environ.get('SMTP_EMAIL', '')
SMTP_PASSWORD = os.environ.get('SMTP_PASSWORD', '')
SENDGRID_API_KEY = os.environ.get('SENDGRID_API_KEY', '')
SENDGRID_FROM_EMAIL = os.environ.get('SENDGRID_FROM_EMAIL', '')

# App download link (update with your actual app store links)
APP_DOWNLOAD_LINK = os.environ.get('APP_DOWNLOAD_LINK', 'https://betz.com/download')


def get_invite_email_html(inviter_name: str, invite_link: str) -> str:
    """Generate HTML email template for invites"""
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>You're Invited to BETZ</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #09090B;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
                <td align="center" style="padding: 40px 20px;">
                    <table role="presentation" style="width: 100%; max-width: 500px; border-collapse: collapse; background-color: #18181B; border-radius: 16px; overflow: hidden;">
                        <!-- Header -->
                        <tr>
                            <td style="padding: 40px 30px 20px; text-align: center; background: linear-gradient(135deg, #F97316 0%, #EA580C 100%);">
                                <h1 style="margin: 0; font-size: 36px; font-weight: 900; color: #FFFFFF; letter-spacing: 2px;">BETZ</h1>
                                <p style="margin: 8px 0 0; font-size: 14px; color: rgba(255,255,255,0.9);">P2P Racing Wagers</p>
                            </td>
                        </tr>
                        
                        <!-- Content -->
                        <tr>
                            <td style="padding: 40px 30px;">
                                <h2 style="margin: 0 0 20px; font-size: 24px; font-weight: 700; color: #FFFFFF; text-align: center;">
                                    You've Been Invited! 🏁
                                </h2>
                                <p style="margin: 0 0 25px; font-size: 16px; line-height: 1.6; color: #A1A1AA; text-align: center;">
                                    <strong style="color: #F97316;">{inviter_name}</strong> wants to race with you on BETZ - the premier platform for P2P racing wagers.
                                </p>
                                
                                <!-- CTA Button -->
                                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                    <tr>
                                        <td align="center" style="padding: 20px 0;">
                                            <a href="{invite_link}" style="display: inline-block; padding: 16px 40px; font-size: 16px; font-weight: 700; color: #FFFFFF; background: linear-gradient(135deg, #F97316 0%, #EA580C 100%); text-decoration: none; border-radius: 50px; text-transform: uppercase; letter-spacing: 1px;">
                                                Join BETZ Now
                                            </a>
                                        </td>
                                    </tr>
                                </table>
                                
                                <!-- Features -->
                                <table role="presentation" style="width: 100%; border-collapse: collapse; margin-top: 30px;">
                                    <tr>
                                        <td style="padding: 15px; background-color: #27272A; border-radius: 12px;">
                                            <p style="margin: 0 0 10px; font-size: 14px; color: #FFFFFF; font-weight: 600;">Why BETZ?</p>
                                            <ul style="margin: 0; padding-left: 20px; color: #A1A1AA; font-size: 14px; line-height: 1.8;">
                                                <li>Secure P2P wagers with escrow</li>
                                                <li>Trusted Designated Persons (DPs)</li>
                                                <li>Fair punk-out system</li>
                                                <li>Real-time race scheduling</li>
                                            </ul>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        
                        <!-- Footer -->
                        <tr>
                            <td style="padding: 20px 30px 30px; text-align: center; border-top: 1px solid #27272A;">
                                <p style="margin: 0; font-size: 12px; color: #71717A;">
                                    Must be 18+ to use BETZ. Please gamble responsibly.
                                </p>
                                <p style="margin: 10px 0 0; font-size: 12px; color: #52525B;">
                                    © 2025 BETZ. All rights reserved.
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """


def get_invite_email_text(inviter_name: str, invite_link: str) -> str:
    """Generate plain text email for invites"""
    return f"""
You've Been Invited to BETZ!
============================

{inviter_name} wants to race with you on BETZ - the premier platform for P2P racing wagers.

Join BETZ now: {invite_link}

Why BETZ?
- Secure P2P wagers with escrow
- Trusted Designated Persons (DPs)
- Fair punk-out system
- Real-time race scheduling

Must be 18+ to use BETZ. Please gamble responsibly.

© 2025 BETZ. All rights reserved.
"""


async def send_email_smtp(to_email: str, subject: str, html_content: str, text_content: str) -> bool:
    """Send email via SMTP (Zoho, Gmail, etc.)"""
    if not SMTP_EMAIL or not SMTP_PASSWORD:
        logger.warning("SMTP credentials not configured")
        return False
    
    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = f"BETZ <{SMTP_EMAIL}>"
        msg['To'] = to_email
        
        # Attach both plain text and HTML versions
        part1 = MIMEText(text_content, 'plain')
        part2 = MIMEText(html_content, 'html')
        msg.attach(part1)
        msg.attach(part2)
        
        # Connect and send
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_EMAIL, SMTP_PASSWORD)
            server.sendmail(SMTP_EMAIL, to_email, msg.as_string())
        
        logger.info(f"✅ Email sent successfully to {to_email}")
        return True
        
    except Exception as e:
        logger.error(f"❌ Failed to send email via SMTP: {str(e)}")
        return False


async def send_email_sendgrid(to_email: str, subject: str, html_content: str, text_content: str) -> bool:
    """Send email via SendGrid API"""
    if not SENDGRID_API_KEY or not SENDGRID_FROM_EMAIL:
        logger.warning("SendGrid credentials not configured")
        return False
    
    try:
        import httpx
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.sendgrid.com/v3/mail/send",
                headers={
                    "Authorization": f"Bearer {SENDGRID_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "personalizations": [{"to": [{"email": to_email}]}],
                    "from": {"email": SENDGRID_FROM_EMAIL, "name": "BETZ"},
                    "subject": subject,
                    "content": [
                        {"type": "text/plain", "value": text_content},
                        {"type": "text/html", "value": html_content}
                    ]
                }
            )
            
            if response.status_code in [200, 202]:
                logger.info(f"✅ Email sent successfully via SendGrid to {to_email}")
                return True
            else:
                logger.error(f"❌ SendGrid error: {response.status_code} - {response.text}")
                return False
                
    except Exception as e:
        logger.error(f"❌ Failed to send email via SendGrid: {str(e)}")
        return False


async def send_invite_email(to_email: str, inviter_name: str, invite_id: str) -> dict:
    """
    Send an invite email to a potential user.
    
    Returns:
        dict: {"success": bool, "message": str, "method": str}
    """
    # Generate invite link
    invite_link = f"{APP_DOWNLOAD_LINK}?ref={invite_id}"
    
    # Generate email content
    subject = f"🏁 {inviter_name} invited you to BETZ - P2P Racing Wagers"
    html_content = get_invite_email_html(inviter_name, invite_link)
    text_content = get_invite_email_text(inviter_name, invite_link)
    
    # Send based on configured provider
    if EMAIL_PROVIDER == 'smtp':
        success = await send_email_smtp(to_email, subject, html_content, text_content)
        return {
            "success": success,
            "message": "Invite email sent!" if success else "Failed to send email. Please try again.",
            "method": "smtp"
        }
    
    elif EMAIL_PROVIDER == 'sendgrid':
        success = await send_email_sendgrid(to_email, subject, html_content, text_content)
        return {
            "success": success,
            "message": "Invite email sent!" if success else "Failed to send email. Please try again.",
            "method": "sendgrid"
        }
    
    else:
        # Mock mode - just log
        logger.info(f"📧 [MOCK] Invite email to {to_email} from {inviter_name}")
        logger.info(f"   Invite link: {invite_link}")
        return {
            "success": True,
            "message": f"Invite sent to {to_email}! (Demo mode - configure EMAIL_PROVIDER for real emails)",
            "method": "mock"
        }


async def send_notification_email(
    to_email: str, 
    subject: str, 
    message: str,
    cta_text: Optional[str] = None,
    cta_link: Optional[str] = None
) -> bool:
    """
    Send a general notification email.
    
    Args:
        to_email: Recipient email
        subject: Email subject
        message: Main message content
        cta_text: Call-to-action button text (optional)
        cta_link: Call-to-action button link (optional)
    """
    # Simple notification template
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <body style="margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #09090B;">
        <div style="max-width: 500px; margin: 0 auto; background-color: #18181B; border-radius: 16px; padding: 30px;">
            <h1 style="color: #F97316; font-size: 24px; margin: 0 0 20px;">BETZ</h1>
            <p style="color: #FFFFFF; font-size: 16px; line-height: 1.6;">{message}</p>
            {f'<a href="{cta_link}" style="display: inline-block; margin-top: 20px; padding: 12px 30px; background: #F97316; color: #FFFFFF; text-decoration: none; border-radius: 25px; font-weight: 600;">{cta_text}</a>' if cta_text and cta_link else ''}
            <p style="color: #71717A; font-size: 12px; margin-top: 30px;">© 2025 BETZ</p>
        </div>
    </body>
    </html>
    """
    
    text_content = f"BETZ\n\n{message}\n\n{f'{cta_text}: {cta_link}' if cta_text and cta_link else ''}\n\n© 2025 BETZ"
    
    if EMAIL_PROVIDER == 'smtp':
        return await send_email_smtp(to_email, subject, html_content, text_content)
    elif EMAIL_PROVIDER == 'sendgrid':
        return await send_email_sendgrid(to_email, subject, html_content, text_content)
    else:
        logger.info(f"📧 [MOCK] Notification to {to_email}: {subject}")
        return True
