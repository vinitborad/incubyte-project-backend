# Sweet Shop API Backend

A Node.js/Express backend API for managing a sweet shop with TypeScript, MongoDB, and comprehensive testing.

## Environment Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local installation or connection to remote database)
- pnpm package manager

### Environment Variables

This project uses environment variables for configuration. Follow these steps to set up your environment:

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Update the `.env` file with your specific configuration:
   ```env
   # Server Configuration
   PORT=5000

   # Database Configuration
   MONGODB_URI=mongodb://127.0.0.1:27017/sweet-shop

   # Node Environment
   NODE_ENV=development
   ```

### Environment Variables Description

| Variable | Description | Default Value |
|----------|-------------|---------------|
| `PORT` | Server port number | `5000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017/sweet-shop` |
| `NODE_ENV` | Node environment (development/production/test) | `development` |

### Installation

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Set up your environment variables (see Environment Setup above)

3. Start MongoDB service locally or ensure your remote MongoDB is accessible

### Running the Application

```bash
# Development
pnpm start

# Run tests
pnpm test

# Build for production
pnpm build
```

## Project Structure

```
src/
  ├── config/          # Database and other configurations
  ├── controllers/     # Route controllers
  ├── models/          # Database models and schemas
  ├── routes/          # API routes
  ├── test-utils/      # Testing utilities
  ├── app.ts           # Express app configuration
  └── server.ts        # Server entry point
```

## Security Notes

- Never commit `.env` files to version control
- Use strong database passwords in production
- Consider adding authentication tokens and API keys to environment variables when implementing security features
- Update `MONGODB_URI` to use proper production database connection strings for production deployments
