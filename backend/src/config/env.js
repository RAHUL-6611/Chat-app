import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the monorepo root
dotenv.config({ path: path.join(__dirname, '../../../.env') });

console.log('Environment variables loaded from root .env');
if (!process.env.OPEN_ROUTER) {
    console.warn('WARNING: OPEN_ROUTER key is missing in .env');
}
