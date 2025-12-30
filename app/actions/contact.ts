'use server'

import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY);

export async function handleContactForm(formData: FormData) {
    const fullName = formData.get('fullName') as string;
    const email = formData.get("email") as string;
    const companyName = formData.get("companyName") as string;

    try {
        const { data, error } = await resend.emails.send({
            from: 'MenuCup Leads <onboarding@resend.dev>',
            to: [process.env.SEND_EMAILS_TO as string],
            subject: `🚀 New Lead: ${companyName}`,
            replyTo: email,
            html: `
            <!DOCTYPE html>
            <html>
                <head>
                <meta charset="utf-8">
                <title>New MenuCup Lead</title>
                </head>
                <body style="background-color: #f8fafc; padding: 40px 10px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border: 1px solid #e2e8f0;">
                    
                    <div style="background-color: #4f46e5; padding: 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.025em;">
                        New Demo Request
                    </h1>
                    <p style="color: #c7d2fe; margin-top: 8px; font-size: 14px; font-weight: 500;">
                        A new venue is ready to pour growth.
                    </p>
                    </div>

                    <div style="padding: 40px 30px;">
                    <div style="margin-bottom: 30px;">
                        <p style="text-transform: uppercase; font-size: 11px; font-weight: 800; letter-spacing: 0.1em; color: #64748b; margin-bottom: 12px;">
                        Venue Details
                        </p>
                        
                        <div style="background-color: #f1f5f9; border-radius: 12px; padding: 20px;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                            <td style="padding: 8px 0; color: #475569; font-size: 14px; width: 40%;"><strong>Restaurant:</strong></td>
                            <td style="padding: 8px 0; color: #1e293b; font-size: 14px;">${companyName}</td>
                            </tr>
                            <tr>
                            <td style="padding: 8px 0; color: #475569; font-size: 14px;"><strong>Contact Name:</strong></td>
                            <td style="padding: 8px 0; color: #1e293b; font-size: 14px;">${fullName}</td>
                            </tr>
                            <tr>
                            <td style="padding: 8px 0; color: #475569; font-size: 14px;"><strong>Email:</strong></td>
                            <td style="padding: 8px 0; color: #1e293b; font-size: 14px;">
                                <a href="mailto:${email}" style="color: #4f46e5; text-decoration: none; font-weight: 600;">${email}</a>
                            </td>
                            </tr>
                        </table>
                        </div>
                    </div>

                    <div style="text-align: center; margin-top: 40px;">
                        <a href="mailto:${email}" style="background-color: #4f46e5; color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block;">
                        Reply to Lead
                        </a>
                    </div>
                    </div>

                    <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
                    <p style="margin: 0; font-size: 12px; color: #94a3b8; font-weight: 500;">
                        Sent automatically by MenuCup CRM
                    </p>
                    <p style="margin: 5px 0 0; font-size: 10px; color: #cbd5e1; text-transform: uppercase; letter-spacing: 0.05em;">
                        © 2025 MenuCup • Poured to Perfection.
                    </p>
                    </div>

                </div>
                </body>
            </html>
            `,
        });
        
        if (error) {
            console.error("Resend Error:", error);
            return { success: false };
        }

        return { success: true };

    } catch (error) {
        console.error("Server Action Error:", error);
        return { success: false };
    }
}