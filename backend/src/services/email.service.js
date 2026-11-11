const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const sendOTPEmail = async (email, otp) => {
  // Development-only mode: log OTP locally instead of sending an email.
  if (process.env.NODE_ENV === "development") {
    console.log(`[DEV ONLY] Verification OTP for ${email}: ${otp}`);
    return { id: "development-otp" };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: [email],
      subject: "Payroll System - Email Verification",
      html: `         <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px;">           <h2 style="color: #1f2937;">Payroll System</h2>           <p>Hello,</p>           <p>Use the following OTP to verify your email address:</p>           <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #2563eb; padding: 16px 0;">
            ${otp}           </div>           <p>This OTP is valid for 5 minutes.</p>           <p style="color: #6b7280; font-size: 13px;">
            If you did not request this verification, please ignore this email.           </p>         </div>
      `,
    });

    if (error) {
      console.error("Resend email error:", error);
      throw new Error("Unable to send verification email");
    }

    return data;
  } catch (error) {
    console.error("Failed to send OTP email:", error.message);
    throw error;
  }
};

module.exports = { sendOTPEmail };
