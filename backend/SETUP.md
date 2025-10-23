# FlowPilot Backend Setup Guide

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment
```bash
cp env.example .env
# Edit .env with your MongoDB URL and Find Labs API credentials
```

### 3. Generate Prisma Client
```bash
npm run db:generate
```

### 4. Set Up Database
```bash
npm run db:push
```

### 5. Start Development Server
```bash
npm run dev
```

## Troubleshooting

### Prisma Client Not Initialized
If you see: `@prisma/client did not initialize yet. Please run "prisma generate"`

**Solution:**
```bash
npm run db:generate
```

### Prisma CLI Not Found
If you see: `prisma : The term 'prisma' is not recognized`

**Solution:**
Use the npm scripts instead of direct prisma commands:
```bash
# Instead of: prisma generate
npm run db:generate

# Instead of: prisma db push  
npm run db:push

# Instead of: prisma studio
npm run db:studio
```

### Schema Validation Errors
If you see: `Type "UInt64" is neither a built-in type`

**Solution:**
The schema has been updated to use `BigInt` instead of `UInt64`. Run:
```bash
npm run db:generate
```

## Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:studio` - Open Prisma Studio
- `npm run db:seed` - Seed database with sample data
- `npm run test:connection` - Test database connectivity
- `npm run test:upsert` - Test upsert performance optimizations

## Environment Variables

Required in `.env`:
```env
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/flowpilot"
FIND_LABS_API_URL="https://api.find.xyz"
FIND_LABS_USERNAME="your_username"
FIND_LABS_PASSWORD="your_password"
PORT=5000
NODE_ENV=development
```

## Next Steps

1. Configure your MongoDB connection
2. Set up Find Labs API credentials
3. Run the setup commands above
4. Test the API endpoints
