const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const sectionRoutes = require('./routes/sectionRoutes');
const taskRoutes = require('./routes/taskRoutes');
const subTaskRoutes = require('./routes/subTaskRoutes');

dotenv.config();
connectDB();

const app = express();
app.use(cookieParser());

// CORS Configuration
const corsOptions = {
    origin: 'http://localhost:5173', 
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true, 
};

app.use(cors(corsOptions));

app.use(express.json());

// Swagger configuration
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Notes/Tasks API',
            version: '1.0.0',
            description: 'API for managing tasks, sections, and users',
        },
    },
    apis: ['./routes/*.js'], // Path to your route files
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Serve Swagger API docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
// http://localhost:5000/api-docs/      --> type it at the url

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/sections', sectionRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/subtasks', subTaskRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
