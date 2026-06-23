const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const path = require('path');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ZipUrl API Documentation',
      version: '1.0.0',
      description: 'Production-ready, interactive API documentation for the ZipUrl URL Shortener backend.',
    },
    servers: [
      {
        url: 'https://zipurl-backend-v8v2.onrender.com',
        description: 'Production server (Render)',
      },
      {
        url: 'http://localhost:5000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token in the format: <token_value>',
        },
      },
    },
  },
  apis: [
    path.join(__dirname, '../routes/auth.routes.js'),
    path.join(__dirname, '../routes/url.routes.js')
  ],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = {
  swaggerUi,
  swaggerSpec,
};