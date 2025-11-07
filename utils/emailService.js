const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Send appointment confirmation email
const sendAppointmentConfirmation = async (userEmail, userName, doctorName, date, time) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: 'Appointment Confirmation - Healthcare App',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1976d2;">Appointment Confirmed!</h2>
          <p>Dear ${userName},</p>
          <p>Your appointment has been successfully booked with the following details:</p>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Doctor:</strong> ${doctorName}</p>
            <p><strong>Date:</strong> ${new Date(date).toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${time}</p>
          </div>
          <p>Please arrive 15 minutes before your scheduled appointment time.</p>
          <p>If you need to reschedule or cancel, please contact us through the app.</p>
          <p>Thank you for choosing our healthcare services!</p>
          <p>Best regards,<br>Healthcare App Team</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Appointment confirmation email sent successfully');
  } catch (error) {
    console.error('Error sending appointment confirmation email:', error);
  }
};

module.exports = {
  sendAppointmentConfirmation
};
