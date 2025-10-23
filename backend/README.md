# FlowPilot Backend

A Node.js/Express backend service for FlowPilot that provides Smart Scan functionality to discover and manage Flow Agents using the Find Labs API.

## Features

- **Smart Scan**: Automatically discover active Flow Agents for users
- **Agent Management**: Store and manage agent metadata
- **User Profiles**: User management with Flow address integration
- **Scan History**: Track scan operations and results
- **RESTful API**: Clean API endpoints for frontend integration

## Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Prisma** - Database ORM
- **MongoDB** - Database
- **Axios** - HTTP client for Find Labs API
- **Helmet** - Security middleware
- **CORS** - Cross-origin resource sharing
- **Rate Limiting** - API protection

## Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Setup

Copy the example environment file and configure:

```bash
cp env.example .env
```

Edit `.env` with your configuration:

```env
# Database
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/flowpilot"

# Find Labs API
FIND_LABS_API_URL="https://api.find.xyz"
FIND_LABS_USERNAME="your_username"
FIND_LABS_PASSWORD="your_password"

# Server
PORT=5000
NODE_ENV=development
```

### 3. Database Setup

Generate Prisma client and push schema:

```bash
npm run db:generate
npm run db:push
```

### 4. Seed Database (Optional)

```bash
npm run db:seed
```

### 5. Start Development Server

```bash
npm run dev
```

The server will start on `http://localhost:5000`

## API Endpoints

### Smart Scan

- **POST** `/api/sync` - Scan for active agents
- **GET** `/api/sync/status/:address` - Get scan status

### Agents

- **GET** `/api/agents/:userId` - Get user's agents
- **GET** `/api/agents/agent/:agentId` - Get specific agent
- **PUT** `/api/agents/agent/:agentId` - Update agent metadata
- **DELETE** `/api/agents/agent/:agentId` - Deactivate agent
- **GET** `/api/agents/stats/:userId` - Get agent statistics

### Users

- **GET** `/api/users/:address` - Get user profile
- **PUT** `/api/users/:address` - Update user profile
- **GET** `/api/users/:address/scan-history` - Get scan history
- **GET** `/api/users/:address/dashboard` - Get dashboard data

## Database Schema

### Users
- `id` - Unique identifier
- `address` - Flow address (unique)
- `nickname` - User-defined nickname
- `email` - Optional email
- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp

### Agents
- `id` - Unique identifier
- `scheduledTxId` - Find Labs scheduled transaction ID
- `ownerAddress` - User's Flow address
- `handlerContract` - Contract address and name
- `status` - Current status (scheduled, executed, etc.)
- `scheduledAt` - Next execution time
- `priority` - Execution priority
- `executionEffort` - Computational effort
- `fees` - Transaction fees
- `nickname` - User-defined nickname
- `description` - User-defined description
- `tags` - Array of tags
- `isActive` - Active status
- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp

### Scan History
- `id` - Unique identifier
- `userAddress` - User's Flow address
- `agentsFound` - Number of agents found
- `scanType` - Type of scan (initial, rescan, manual)
- `success` - Scan success status
- `errorMessage` - Error message if failed
- `createdAt` - Scan timestamp

## Smart Scan Process

1. **Receive Request**: User provides Flow address
2. **Upsert User**: Find or create user in single atomic operation
3. **Query Find Labs API**: Fetch scheduled transactions for the address
4. **Filter Results**: Only include active/scheduled transactions
5. **Parallel Upsert Agents**: Process all agents concurrently using upsert operations
6. **Store Scan History**: Record successful scan operation
7. **Return Response**: Send processed data to frontend

### Performance Optimizations

- **Time-based Caching**: Avoids API calls when data is fresh (configurable interval)
- **State Reconciliation**: Only processes changes instead of reprocessing everything
- **Upsert Operations**: Single database call instead of find + create/update
- **Parallel Processing**: All agent operations run concurrently with `Promise.all`
- **Centralized Prisma Client**: Prevents connection pool exhaustion
- **Atomic Operations**: Ensures data consistency during concurrent requests

## Error Handling

The API includes comprehensive error handling for:

- **Validation Errors**: Invalid request data
- **Database Errors**: Prisma/database issues
- **API Errors**: Find Labs API failures
- **Rate Limiting**: Too many requests
- **Authentication**: Missing credentials

## Security Features

- **Helmet**: Security headers
- **CORS**: Cross-origin protection
- **Rate Limiting**: Request throttling
- **Input Validation**: Request validation
- **Error Sanitization**: Safe error responses

## Development

### Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:studio` - Open Prisma Studio
- `npm run db:seed` - Seed database with sample data
- `npm run test:connection` - Test database connectivity
- `npm run test:upsert` - Test upsert performance optimizations
- `npm run test:cache` - Test caching and reconciliation performance

### Project Structure

```
backend/
├── src/
│   ├── middleware/
│   │   ├── errorHandler.js
│   │   └── validation.js
│   ├── routes/
│   │   ├── sync.js
│   │   ├── agents.js
│   │   └── users.js
│   ├── services/
│   │   └── agentScannerService.js
│   ├── scripts/
│   │   └── seed.js
│   └── server.js
├── prisma/
│   └── schema.prisma
├── package.json
├── env.example
└── README.md
```

## Production Deployment

1. Set `NODE_ENV=production`
2. Configure production database URL
3. Set up proper Find Labs API credentials
4. Configure CORS for production domain
5. Set up monitoring and logging
6. Use process manager (PM2) for production

## Troubleshooting

### Common Issues

1. **Database Connection**: Check `DATABASE_URL` in `.env`
2. **Find Labs API**: Verify credentials and API availability
3. **CORS Issues**: Check `CORS_ORIGIN` configuration
4. **Rate Limiting**: Adjust limits in production

### Logs

The application logs important events:
- Scan operations
- API calls
- Database operations
- Errors and warnings

## Contributing

1. Follow the existing code structure
2. Add proper error handling
3. Include input validation
4. Update documentation
5. Test thoroughly

## License

MIT License - see LICENSE file for details
