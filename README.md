💈 BarberShop — Booking & Management Backend

A Node.js and Express REST API for a barbershop booking and management platform.

The backend provides authentication and role-based authorization, barber management, appointment booking, availability and scheduling, administrative analytics, revenue reporting, email notifications, and automated background jobs.

✨ Features

🔐 Authentication & Authorization

- User registration and login
- JWT-based authentication
- Refresh-token support
- Protected API routes
- Role-based access control
- Three user roles:
  - "client"
  - "barber"
  - "admin"
- Password hashing with bcrypt
- Current-user endpoint

💇 Barber Management

- Create and manage barber profiles
- Barber specializations
- Barber biography and experience
- Barber ratings
- Profile photos
- Working hours
- Break periods
- Service configuration
- Service pricing and duration
- Barber availability management

📅 Booking & Appointment Management

Clients can:

- Create appointments
- View their bookings
- Cancel bookings

Barbers and admins can:

- View barber-specific bookings
- Update booking status
- Manage appointment workflows

Supported booking statuses:

- "pending"
- "confirmed"
- "completed"
- "cancelled"
- "no-show"

The booking model also tracks:

- Service name
- Service price
- Service duration
- Appointment date
- Start and end time
- Total amount
- Payment status
- Down payment
- Remaining amount
- Cancellation reason
- Reminder status

🕒 Availability & Scheduling

The API supports:

- Checking available appointment times
- Multi-day availability
- Booking-time validation
- Barber schedules
- Bulk working-day updates
- Working and non-working days
- Time-slot management

Schedules are associated with individual barbers and their working configuration.

📊 Admin Dashboard & Analytics

Admin users can access dashboard information including:

- Total users
- Active barbers
- Total bookings
- Total revenue
- Today's bookings
- Pending bookings
- Revenue trends
- Booking trends
- User growth
- Average revenue
- Peak booking hour
- Top-performing service
- Booking completion rate

Revenue reporting supports:

- Daily reporting
- Weekly reporting
- Monthly reporting
- Revenue by barber
- Booking counts
- Average order value

The backend also includes period comparison and revenue forecasting functionality.

📧 Email Notifications

The application integrates Nodemailer for transactional email.

Implemented email flows include:

- Welcome emails
- Booking confirmation notifications
- Appointment reminders
- Booking status updates

🤖 Automated Background Jobs

The backend uses "node-cron" for scheduled tasks.

Appointment reminders

A scheduled job checks upcoming confirmed bookings and sends reminder emails shortly before the appointment.

Booking cleanup

A daily scheduled job removes older completed, cancelled and no-show bookings according to the configured retention logic.

🛡️ Security & API Protection

The backend includes several layers of API protection:

- Helmet security headers
- JWT authentication
- Role-based authorization
- Request validation with "express-validator"
- General API rate limiting
- Authentication rate limiting
- Booking rate limiting
- HTTP parameter pollution protection
- CORS configuration
- Password hashing with bcrypt
- Centralized error handling
- Request body size limits

🏗️ Architecture

The backend follows a modular Express/Mongoose structure with separate areas for authentication, barbers, bookings, scheduling, availability and administration.

BarberShop/
├── Admin/
│   ├── adminController.js
│   └── adminRoutes.js
│
├── Availability/
│   ├── availabilityController.js
│   └── availabilityRoutes.js
│
├── Barbers/
│   ├── barbersModel/
│   └── barbersRoute/
│
├── Booking/
│   ├── bookingModel/
│   ├── bookingController/
│   └── bookingRoute/
│
├── Jobs/
│   └── BppkingReminder.js
│
├── Users/
│   └── usersModel/
│
├── auth/
│   ├── authController.js
│   └── authroutes.js
│
├── config/
│   ├── database.js
│   ├── jwtConfig.js
│   └── emailconfig.js
│
├── controllers/
├── middleware/
├── schedule/
├── service/
├── utils/
│
├── index.js
└── package.json

🧰 Tech Stack

Layer| Technology
Runtime| Node.js
Framework| Express.js
Database| MongoDB
ODM| Mongoose
Authentication| JWT
Password Security| bcryptjs
Validation| express-validator
Email| Nodemailer
Scheduling| node-cron
Security| Helmet, HPP, rate limiting
API| REST

🔑 Main API Routes

Authentication

POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh-token
GET  /api/auth/me

Barbers

GET  /api/barbers
GET  /api/barbers/:id
GET  /api/barbers/:id/stats
POST /api/barbers
PUT  /api/barbers/:id
PUT  /api/barbers/:id/availability

Bookings

POST /api/bookings
GET  /api/bookings/my-bookings
PUT  /api/bookings/:id/cancel
GET  /api/bookings/barber/:barberId
PUT  /api/bookings/:id/status

GET  /api/bookings/all
GET  /api/bookings/stats
GET  /api/bookings/stats/daily
GET  /api/bookings/stats/weekly
GET  /api/bookings/stats/monthly

Availability

GET  /api/availability/barber/:barberId
GET  /api/availability/barber/:barberId/multi-day
POST /api/availability/validate

Scheduling

PUT /api/schedules/barber/:barberId/bulk

Administration

GET /api/admin/dashboard
GET /api/admin/users
PUT /api/admin/users/:id/role
GET /api/admin/revenue

Health Check

GET /api/health

👥 Role-Based Access

The API separates permissions by user role.

Role| Example capabilities
"client"| Create and manage personal bookings
"barber"| Manage barber bookings, profile availability and schedules
"admin"| Manage barbers/users and access business analytics and revenue data

Protected routes use JWT authentication and role-based authorization middleware.

🚀 Getting Started

Prerequisites

- Node.js
- MongoDB
- npm

1. Clone the repository

git clone https://github.com/Fanitu/BarberShop.git
cd BarberShop

2. Install dependencies

npm install

3. Configure environment variables

Create a ".env" file locally.

Example structure:

PORT=5000
NODE_ENV=development

MONGODB_URI=your_mongodb_connection_string

JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

JWT_REFRESH_SECRET=your_refresh_secret
JWT_REFRESH_EXPIRES_IN=30d

EMAIL_USER=your_email
EMAIL_PASS=your_email_password
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_FROM=your_sender_email
CLIENT_URL=your_frontend_url

Never commit ".env" files or real credentials to GitHub.

4. Run in development

npm run dev

5. Run in production

npm start

The default port is "5000" unless another "PORT" value is configured.

🧠 Engineering Highlights

This project demonstrates experience with:

- REST API design
- Modular Express architecture
- MongoDB data modeling
- Mongoose relationships and aggregation
- JWT authentication
- Role-based authorization
- Input validation
- API rate limiting
- Security middleware
- Appointment scheduling logic
- Availability management
- Business analytics
- Revenue aggregation
- Automated background jobs
- Transactional email
- Production-oriented error handling

📈 Business Use Case

The backend is designed around real barbershop operations rather than a simple demonstration CRUD application.

It models the workflow between:

Client
   ↓
Barber Selection
   ↓
Service Selection
   ↓
Availability
   ↓
Appointment Booking
   ↓
Booking Confirmation
   ↓
Appointment Completion
   ↓
Revenue & Business Analytics

This makes the project a practical example of applying full-stack development to a real-world service business workflow.

🔗 Project

Frontend deployment and additional project information are available through the repository's GitHub project information.

👨‍💻 Author

Fanuel Bahta

Full-Stack Web Developer

Specializing in:

- React
- Node.js
- Express.js
- MongoDB
- REST APIs
- Authentication & Authorization