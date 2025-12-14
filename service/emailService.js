const transporter = require('../config/emailConfig');

const sendEmail = async (options) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'Barber Booking System <noreply@barberbooking.com>',
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
    // Optional attachments
    attachments: options.attachments || [],
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${options.to}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`❌ Error sending email to ${options.to}:`, error);
    throw error;
  }
};

const sendWelcomeEmail = async (data) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Barber Booking!</title>
        <style>
            body {
                font-family: 'Arial', sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f9f9f9;
            }
            .container {
                background-color: #ffffff;
                border-radius: 10px;
                padding: 30px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                border: 1px solid #e0e0e0;
            }
            .header {
                text-align: center;
                padding-bottom: 20px;
                border-bottom: 3px solid #4CAF50;
                margin-bottom: 30px;
            }
            .logo {
                font-size: 32px;
                font-weight: bold;
                color: #4CAF50;
                margin-bottom: 10px;
            }
            .logo span {
                color: #333;
            }
            .welcome-text {
                font-size: 18px;
                color: #666;
            }
            .welcome-name {
                color: #4CAF50;
                font-weight: bold;
                font-size: 24px;
                margin: 10px 0;
            }
            .content {
                padding: 20px 0;
            }
            .features {
                background-color: #f8f9fa;
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
                border-left: 4px solid #4CAF50;
            }
            .feature-item {
                display: flex;
                align-items: center;
                margin-bottom: 12px;
            }
            .feature-icon {
                color: #4CAF50;
                font-size: 20px;
                margin-right: 10px;
            }
            .cta-button {
                display: inline-block;
                background: linear-gradient(135deg, #4CAF50, #45a049);
                color: white;
                padding: 14px 32px;
                text-decoration: none;
                border-radius: 50px;
                font-weight: bold;
                text-align: center;
                margin: 25px auto;
                box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
                transition: all 0.3s ease;
            }
            .cta-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(76, 175, 80, 0.4);
            }
            .steps {
                margin: 30px 0;
            }
            .step {
                display: flex;
                align-items: center;
                margin-bottom: 20px;
                padding: 15px;
                background: white;
                border-radius: 8px;
                border: 1px solid #e0e0e0;
            }
            .step-number {
                background-color: #4CAF50;
                color: white;
                width: 36px;
                height: 36px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                margin-right: 15px;
                flex-shrink: 0;
            }
            .user-info {
                background-color: #e8f5e9;
                padding: 15px;
                border-radius: 8px;
                margin: 20px 0;
                border-left: 4px solid #4CAF50;
            }
            .info-row {
                display: flex;
                justify-content: space-between;
                padding: 8px 0;
                border-bottom: 1px dashed #c8e6c9;
            }
            .info-label {
                font-weight: bold;
                color: #388e3c;
            }
            .footer {
                text-align: center;
                padding-top: 20px;
                border-top: 1px solid #e0e0e0;
                margin-top: 30px;
                color: #666;
                font-size: 14px;
            }
            .social-links {
                margin: 20px 0;
            }
            .social-icon {
                display: inline-block;
                margin: 0 10px;
                color: #4CAF50;
                text-decoration: none;
                font-size: 18px;
            }
            .support {
                background-color: #fff3cd;
                padding: 15px;
                border-radius: 8px;
                margin: 20px 0;
                border-left: 4px solid #ffc107;
            }
            @media (max-width: 600px) {
                .container {
                    padding: 20px;
                }
                .cta-button {
                    display: block;
                    width: 100%;
                    box-sizing: border-box;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">✂️ <span> HABESHA Booking</span></div>
                <p class="welcome-text">Welcome to the family!</p>
            </div>
            
            <div class="content">
                <h1 style="text-align: center; color: #333; margin-bottom: 10px;">
                    Hello <span class="welcome-name">${data.name}</span>! 👋
                </h1>
                
                <p style="text-align: center; font-size: 16px; color: #666;">
                    We're thrilled to have you join our community of style enthusiasts!
                </p>
                
                <div class="user-info">
                    <h3 style="color: #388e3c; margin-top: 0;">Your Account Details:</h3>
                    <div class="info-row">
                        <span class="info-label">Name:</span>
                        <span>${data.name}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Email:</span>
                        <span>${data.email}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Account Created:</span>
                        <span>${new Date().toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                        })}</span>
                    </div>
                </div>
                
                <div class="features">
                    <h3 style="color: #333; margin-top: 0;">🎯 What You Can Do Now:</h3>
                    <div class="feature-item">
                        <span class="feature-icon">✓</span>
                        <span>Book appointments with expert barbers</span>
                    </div>
                    <div class="feature-item">
                        <span class="feature-icon">✓</span>
                        <span>View barber schedules in real-time</span>
                    </div>
                    <div class="feature-item">
                        <span class="feature-icon">✓</span>
                        <span>Receive appointment reminders</span>
                    </div>
                    <div class="feature-item">
                        <span class="feature-icon">✓</span>
                        <span>Manage all your bookings in one place</span>
                    </div>
                </div>
                
                <div class="steps">
                    <h3 style="color: #333; margin-bottom: 20px;">🚀 Get Started in 3 Easy Steps:</h3>
                    
                    <div class="step">
                        <div class="step-number">1</div>
                        <div>
                            <h4 style="margin: 0; color: #333;">Browse Barbers</h4>
                            <p style="margin: 5px 0 0; color: #666;">Explore our talented barbers and their specialties</p>
                        </div>
                    </div>
                    
                    <div class="step">
                        <div class="step-number">2</div>
                        <div>
                            <h4 style="margin: 0; color: #333;">Choose Time Slot</h4>
                            <p style="margin: 5px 0 0; color: #666;">Pick a convenient time from available slots</p>
                        </div>
                    </div>
                    
                    <div class="step">
                        <div class="step-number">3</div>
                        <div>
                            <h4 style="margin: 0; color: #333;">Confirm Booking</h4>
                            <p style="margin: 5px 0 0; color: #666;">Secure your spot with easy payment</p>
                        </div>
                    </div>
                </div>
                
                <div style="text-align: center;">
                    <a href="${data.dashboardUrl}" class="cta-button">
                        🚀 Start Booking Now
                    </a>
                </div>
                
                <div class="support">
                    <h4 style="color: #856404; margin-top: 0;">💡 Need Help?</h4>
                    <p style="margin: 10px 0; color: #856404;">
                        Our support team is here to help! Contact us at 
                        <a href="mailto:support@barberbooking.com" style="color: #856404; font-weight: bold;">
                            support@HABESHAbooking.com
                        </a>
                    </p>
                </div>
            </div>
            
            <div class="footer">
                <p style="margin: 10px 0;">
                    <strong>Stay Connected:</strong>
                </p>
                <div class="social-links">
                    <a href="#" class="social-icon">📘</a>
                    <a href="#" class="social-icon">🐦</a>
                    <a href="#" class="social-icon">📸</a>
                    <a href="#" class="social-icon">📧</a>
                </div>
                
                <p style="margin: 15px 0; font-size: 12px; color: #999;">
                    This is an automated email. Please do not reply to this message.<br>
                    If you have any questions, contact our support team.
                </p>
                
                <p style="margin: 5px 0; font-size: 12px; color: #999;">
                    © ${new Date().getFullYear()} Barber Booking System. All rights reserved.<br>
                    Making grooming appointments simple and convenient.
                </p>
            </div>
        </div>
    </body>
    </html>
  `;

  const text = `
Welcome to Barber Booking, ${data.name}!

We're excited to have you join our community!

Your Account Details:
- Name: ${data.name}
- Email: ${data.email}
- Account Created: ${new Date().toLocaleDateString()}

What you can do now:
✓ Book appointments with expert barbers
✓ View barber schedules in real-time
✓ Receive appointment reminders
✓ Manage all your bookings in one place

Get started: ${data.dashboardUrl}

Need help? Contact our support team at support@barberbooking.com

Best regards,
The Barber Booking Team
  `;

  return sendEmail({
    to: data.email,
    subject: `Welcome to Barber Booking, ${data.name}! ✂️`,
    html,
    text,
  });
};

const sendBookingConfirmation = async (data) => {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4CAF50; color: white; padding: 10px; text-align: center; }
          .content { padding: 20px; border: 1px solid #ddd; }
          .footer { text-align: center; margin-top: 20px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>New Booking Request</h2>
          </div>
          <div class="content">
            <p>Hello Barber,</p>
            <p>You have a new booking request with the following details:</p>
            <ul>
              <li><strong>Client:</strong> ${data.clientName}</li>
              <li><strong>Service:</strong> ${data.service}</li>
              <li><strong>Date:</strong> ${new Date(data.date).toDateString()}</li>
              <li><strong>Time:</strong> ${data.time}</li>
              <li><strong>Down Payment:</strong> $${data.amount.toFixed(2)}</li>
              <li><strong>Booking ID:</strong> ${data.bookingId}</li>
            </ul>
            <p>Please login to your dashboard to verify the payment receipt and confirm the booking.</p>
            <p><a href="${process.env.CLIENT_URL}/barber/dashboard">Go to Dashboard</a></p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Barber Booking System. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: data.to,
    subject: 'New Booking Request - Action Required',
    html,
  });
};

const sendReminderEmail = async (data) => {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #FF9800; color: white; padding: 10px; text-align: center; }
          .content { padding: 20px; border: 1px solid #ddd; }
          .footer { text-align: center; margin-top: 20px; color: #666; }
          .reminder { background-color: #FFF3CD; padding: 15px; border-radius: 5px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Appointment Reminder</h2>
          </div>
          <div class="content">
            <div class="reminder">
              <h3>⏰ Don't Forget Your Appointment!</h3>
            </div>
            <p>Hello ${data.clientName},</p>
            <p>This is a friendly reminder about your upcoming appointment:</p>
            <ul>
              <li><strong>Barber:</strong> ${data.barberName}</li>
              <li><strong>Service:</strong> ${data.service}</li>
              <li><strong>Date:</strong> ${new Date(data.bookingDate).toDateString()}</li>
              <li><strong>Time:</strong> ${data.startTime}</li>
              <li><strong>Location:</strong> Our Barber Shop</li>
            </ul>
            <p><strong>Important:</strong> Please arrive 5-10 minutes before your scheduled time.</p>
            <p>If you need to reschedule or cancel, please do so at least 2 hours in advance.</p>
            <p><a href="${process.env.CLIENT_URL}/my-bookings">View Your Bookings</a></p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Barber Booking System. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: data.to,
    subject: 'Reminder: Your Barber Appointment is in 10 Minutes',
    html,
  });
};

const sendBookingStatusUpdate = async (data) => {
  const statusColors = {
    confirmed: '#4CAF50',
    cancelled: '#F44336',
    completed: '#2196F3',
  };

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: ${statusColors[data.status] || '#9E9E9E'}; color: white; padding: 10px; text-align: center; }
          .content { padding: 20px; border: 1px solid #ddd; }
          .footer { text-align: center; margin-top: 20px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Booking ${data.status.charAt(0).toUpperCase() + data.status.slice(1)}</h2>
          </div>
          <div class="content">
            <p>Hello ${data.clientName},</p>
            <p>Your booking has been <strong>${data.status}</strong>.</p>
            <p><strong>Details:</strong></p>
            <ul>
              <li><strong>Booking ID:</strong> ${data.bookingId}</li>
              <li><strong>Service:</strong> ${data.service}</li>
              <li><strong>Date:</strong> ${new Date(data.date).toDateString()}</li>
              <li><strong>Time:</strong> ${data.time}</li>
              ${data.reason ? `<li><strong>Reason:</strong> ${data.reason}</li>` : ''}
            </ul>
            ${data.status === 'confirmed' 
              ? '<p>Your appointment is confirmed! We look forward to seeing you.</p>' 
              : data.status === 'cancelled'
              ? '<p>Your booking has been cancelled. If you have any questions, please contact us.</p>'
              : '<p>Thank you for choosing our service!</p>'
            }
            <p><a href="${process.env.CLIENT_URL}/my-bookings">View Your Bookings</a></p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Barber Booking System. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: data.to,
    subject: `Booking ${data.status.charAt(0).toUpperCase() + data.status.slice(1)}: ${data.service}`,
    html,
  });
};

// Export all email functions
module.exports = {
  sendEmail,
  sendBookingConfirmation,
  sendReminderEmail,
  sendBookingStatusUpdate,
  sendWelcomeEmail,  
};