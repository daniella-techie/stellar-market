// This file is auto-generated for API client generation and Postman import
const fs = require('fs');
const { swaggerSpec } = require('./src/config/swagger');

fs.writeFileSync('./openapi.json', JSON.stringify(swaggerSpec, null, 2));
console.log('openapi.json exported');
