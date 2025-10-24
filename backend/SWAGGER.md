# FlowPilot Backend - Swagger API Documentation

This document describes the Swagger integration for the FlowPilot Backend API.

## Overview

The FlowPilot Backend API is now fully documented with Swagger/OpenAPI 3.0 specification. This provides:

- **Interactive API Documentation**: Browse and test endpoints directly in the browser
- **Auto-generated Client SDKs**: Generate client libraries for various languages
- **API Validation**: Ensure request/response schemas are correct
- **Developer Experience**: Easy-to-understand API structure and examples

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Start the Server

```bash
# Development
npm run dev

# Production
npm start
```

### 3. Access Swagger Documentation

Open your browser and navigate to:
```
http://localhost:5000/api-docs
```

## API Documentation Structure

### Tags

The API is organized into the following sections:

- **Health**: Health check endpoints
- **Sync**: Smart scan and synchronization endpoints
- **Agents**: Agent management endpoints
- **Users**: User profile and dashboard endpoints

### Endpoints Overview

#### Health Endpoints
- `GET /health` - Health check

#### Sync Endpoints
- `POST /api/sync` - Smart scan for agents
- `GET /api/sync/status/{address}` - Get scan status

#### Agent Endpoints
- `GET /api/agents/{userId}` - Get all agents for a user
- `GET /api/agents/agent/{agentId}` - Get specific agent details
- `PUT /api/agents/agent/{agentId}` - Update agent metadata
- `DELETE /api/agents/agent/{agentId}` - Soft delete an agent
- `GET /api/agents/stats/{userId}` - Get agent statistics

#### User Endpoints
- `GET /api/users/{address}` - Get user profile
- `PUT /api/users/{address}` - Update user profile
- `GET /api/users/{address}/scan-history` - Get scan history
- `GET /api/users/{address}/dashboard` - Get dashboard data

## Data Models

### Core Schemas

#### User
```json
{
  "id": "uuid",
  "address": "0x1234567890abcdef",
  "nickname": "FlowUser123",
  "email": "user@example.com",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### Agent
```json
{
  "id": "uuid",
  "scheduledTxId": "0xabcdef1234567890",
  "ownerAddress": "0x1234567890abcdef",
  "handlerContract": "CounterTransactionHandler",
  "status": "scheduled",
  "scheduledAt": "2024-01-01T12:00:00.000Z",
  "priority": 1,
  "executionEffort": "1000",
  "fees": 0.001,
  "nickname": "My Counter Agent",
  "description": "Automated counter increment agent",
  "tags": ["automation", "counter", "daily"],
  "isActive": true
}
```

#### ScanHistory
```json
{
  "id": "uuid",
  "userAddress": "0x1234567890abcdef",
  "agentsFound": 5,
  "scanType": "reconciliation",
  "success": true,
  "errorMessage": null,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

## Testing the API

### Using Swagger UI

1. Navigate to `http://localhost:5000/api-docs`
2. Click on any endpoint to expand it
3. Click "Try it out" button
4. Fill in the required parameters
5. Click "Execute" to test the endpoint

### Using curl

```bash
# Health check
curl http://localhost:5000/health

# Smart scan
curl -X POST http://localhost:5000/api/sync \
  -H "Content-Type: application/json" \
  -d '{"address": "0x1234567890abcdef"}'

# Get user profile
curl http://localhost:5000/api/users/0x1234567890abcdef
```

### Using the Test Script

```bash
# Run Swagger integration tests
npm run test:swagger
```

## Configuration

### Swagger Configuration

The Swagger configuration is located in `src/config/swagger.js` and includes:

- **API Information**: Title, version, description, contact details
- **Server URLs**: Development and production server endpoints
- **Security Schemes**: Bearer token authentication
- **Data Schemas**: Complete type definitions for all models
- **API Tags**: Organized endpoint grouping

### Customization

To modify the Swagger documentation:

1. **Update API Info**: Edit the `info` section in `src/config/swagger.js`
2. **Add New Schemas**: Define new data models in the `schemas` section
3. **Modify Endpoints**: Update JSDoc comments in route files
4. **Change UI Theme**: Modify the `customCss` in `server.js`

## Development Workflow

### Adding New Endpoints

1. **Create the Route**: Add your endpoint in the appropriate route file
2. **Add JSDoc Comments**: Include Swagger documentation above the route handler
3. **Define Schemas**: Add any new data models to `swagger.js`
4. **Test Documentation**: Verify the endpoint appears in Swagger UI

### Example: Adding a New Endpoint

```javascript
/**
 * @swagger
 * /api/example:
 *   get:
 *     summary: Example endpoint
 *     description: This is an example endpoint
 *     tags: [Example]
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
router.get('/example', (req, res) => {
  res.json({ message: 'Hello World' });
});
```

## Production Considerations

### Security

- **Rate Limiting**: API endpoints are protected with rate limiting
- **CORS**: Configured for specific origins
- **Helmet**: Security headers enabled
- **Input Validation**: All inputs are validated using express-validator

### Performance

- **Caching**: Smart scan results are cached to reduce API calls
- **Compression**: Response compression enabled
- **Database Optimization**: Efficient queries with Prisma ORM

### Monitoring

- **Health Checks**: `/health` endpoint for monitoring
- **Logging**: Morgan logging for request tracking
- **Error Handling**: Centralized error handling with detailed responses

## Troubleshooting

### Common Issues

1. **Swagger UI Not Loading**
   - Check if server is running on correct port
   - Verify all dependencies are installed
   - Check browser console for errors

2. **API Endpoints Not Working**
   - Verify database connection
   - Check environment variables
   - Review server logs for errors

3. **Documentation Not Updating**
   - Restart the server after making changes
   - Clear browser cache
   - Check JSDoc comment syntax

### Debug Commands

```bash
# Check if server is running
curl http://localhost:5000/health

# Test Swagger UI
curl http://localhost:5000/api-docs

# Run integration tests
npm run test:swagger

# Check dependencies
npm list swagger-jsdoc swagger-ui-express
```

## API Examples

### Smart Scan Example

```bash
curl -X POST http://localhost:5000/api/sync \
  -H "Content-Type: application/json" \
  -d '{
    "address": "0x1234567890abcdef"
  }'
```

Response:
```json
{
  "success": true,
  "message": "Smart Scan completed with state reconciliation",
  "data": {
    "user": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "address": "0x1234567890abcdef",
      "nickname": null
    },
    "agents": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "scheduledTxId": "0xabcdef1234567890",
        "handlerContract": "CounterTransactionHandler",
        "status": "scheduled",
        "scheduledAt": "2024-01-01T12:00:00.000Z",
        "nickname": "My Counter Agent",
        "description": "Automated counter increment agent",
        "tags": ["automation", "counter", "daily"],
        "isActive": true
      }
    ],
    "scanSummary": {
      "totalFound": 1,
      "processed": 1,
      "scannedAt": "2024-01-01T00:00:00.000Z",
      "reconciliation": {
        "created": 1,
        "updated": 0,
        "deactivated": 0
      }
    }
  }
}
```

### Get User Dashboard Example

```bash
curl http://localhost:5000/api/users/0x1234567890abcdef/dashboard
```

Response:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "address": "0x1234567890abcdef",
      "nickname": "FlowUser123",
      "email": "user@example.com"
    },
    "stats": {
      "totalAgents": 5,
      "byStatus": {
        "scheduled": 3,
        "executed": 1,
        "completed": 1
      },
      "recentScans": 2,
      "upcomingExecutions": 3
    },
    "upcomingAgents": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "scheduledTxId": "0xabcdef1234567890",
        "handlerContract": "CounterTransactionHandler",
        "scheduledAt": "2024-01-01T12:00:00.000Z",
        "nickname": "My Counter Agent"
      }
    ],
    "recentScans": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "agentsFound": 5,
        "scanType": "reconciliation",
        "success": true,
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

## Support

For questions or issues with the API documentation:

1. Check the Swagger UI at `http://localhost:5000/api-docs`
2. Review the server logs for error messages
3. Run the test suite: `npm run test:swagger`
4. Check the API endpoint responses for detailed error information

## License

This API documentation is part of the FlowPilot project and is licensed under the MIT License.
