const helmet = require('helmet');
const xss = require('xss-clean');
const hpp = require('hpp');
const mongoSanitize = require('express-mongo-sanitize');

const securityMiddleware = (app) => {
  // Set security HTTP headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  }));

  // Data sanitization against NoSQL query injection
  //app.use(mongoSanitize());

  // Data sanitization against XSS
  //app.use(xss());

  // Prevent parameter pollution
  app.use(hpp({
    whitelist: ['price', 'duration', 'rating', 'date'],
  }));

  // Security headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });
};

module.exports = securityMiddleware;