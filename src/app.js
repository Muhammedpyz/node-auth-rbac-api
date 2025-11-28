const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
// const xss = require('xss-clean');
const hpp = require('hpp');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
// const mongoSanitize = require('express-mongo-sanitize'); // Incompatible with Express 5
const validator = require('validator');
const apicache = require('apicache');
let cache = apicache.middleware;

// Routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

// Global Middlewares
app.use(helmet()); // Set security HTTP headers
app.use(cors()); // Enable CORS
app.use(express.json({ limit: '10kb' })); // Body parser, reading data from body into req.body
// app.use(mongoSanitize()); // Data sanitization against NoSQL query injection (Removed)
app.use(hpp()); // Prevent parameter pollution
app.use(compression()); // Compress all responses

// Development Logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Custom XSS Sanitization Middleware
app.use((req, res, next) => {
    if (req.body) {
        for (let key in req.body) {
            if (typeof req.body[key] === 'string') {
                req.body[key] = validator.escape(req.body[key]);
            }
        }
    }
    next();
});

// Rate Limiting (Basic global limit)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api', limiter);

// Routes
// Routes
// Strict Rate Limiting for Auth
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 login/register requests per windowMs
    message: 'Too many login attempts from this IP, please try again after 15 minutes'
});
app.use('/api/auth', authLimiter, authRoutes);

// Public Routes with Caching (5 minutes)
app.use('/api/public', cache('5 minutes'), (req, res, next) => {
    // We need to mount the userRoutes but only for public paths? 
    // Actually userRoutes has mixed public/private. 
    // Let's just apply cache to the specific public route in userRoutes or mount it separately.
    // For simplicity/demo, let's keep using userRoutes but we can't easily wrap *just* the public one here without splitting files.
    // Alternative: Apply cache inside userRoutes.js or userController.js.
    // Let's do it here for the whole /api path but that's bad for auth.
    // Better: Let's split userRoutes in app.js or just apply cache to the specific path here if possible.
    // Express allows app.get('/path', cache, handler).
    // Since we are using router, let's just use the router.
    next();
});
app.use('/api', userRoutes);

// Root Route
app.get('/', (req, res) => {
    res.send('API is running...');
});

// Debug Frontend
const path = require('path');
app.use('/debug', express.static(path.join(__dirname, '../debug_client')));

// Swagger Documentation
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// Error Handling Middleware
const globalErrorHandler = require('./middlewares/errorMiddleware');
app.use(globalErrorHandler);

module.exports = app;
