import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the monorepo root
dotenv.config({ path: path.join(__dirname, '../../../.env') });

const requiredEnvVars = [
  'MONGODB_URI',
  'JWT_SECRET',
  'OPEN_ROUTER',
  // 'FRONTEND_URL' // Optional, defaults to localhost
];

const missingVars = requiredEnvVars.filter(key => !process.env[key]);

if (missingVars.length > 0) {
  console.error('❌ CRITICAL ERROR: Missing required environment variables:');
  missingVars.forEach(key => console.error(`   - ${key}`));
  process.exit(1); // Fail fast
}

console.log('✅ Environment variables loaded successfully');
