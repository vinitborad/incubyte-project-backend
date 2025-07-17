import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('🔧 Environment Configuration:');
console.log('=====================================');
console.log(`PORT: ${process.env.PORT || 'Not set (will use default 5000)'}`);
console.log(`MONGODB_URI: ${process.env.MONGODB_URI || 'Not set (will use default)'}`);
console.log(`NODE_ENV: ${process.env.NODE_ENV || 'Not set (will use default)'}`);
console.log('=====================================');

// Validate required environment variables
const requiredEnvVars = ['MONGODB_URI'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingEnvVars.forEach(varName => console.error(`  - ${varName}`));
  console.error('Please check your .env file and ensure all required variables are set.');
  process.exit(1);
} else {
  console.log('✅ All required environment variables are set!');
}
