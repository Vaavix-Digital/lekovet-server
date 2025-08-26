const dotenv = require('dotenv');
const envName = process.env.NODE_ENV;
if (envName === 'production') {
	dotenv.config({ path: '.prod.env' });
} else if (envName === 'development') {
	dotenv.config({ path: '.dev.env' });
} else {
	dotenv.config();
}

const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
	env: process.env.NODE_ENV || 'development',
	isProduction,
	port: Number(process.env.PORT || 4000),
	jwtSecret: process.env.JWT_SECRET || 'dev-secret',
	mongoUri: process.env.MONGO_URI || '',
	seedAdminEmail: process.env.SEED_ADMIN_EMAIL || 'admin@example.com',
	seedAdminPassword: process.env.SEED_ADMIN_PASSWORD || 'admin123',
	seedUserEmail: process.env.SEED_USER_EMAIL || 'user@example.com',
	seedUserPassword: process.env.SEED_USER_PASSWORD || 'user123',
	googleClientId: process.env.GOOGLE_CLIENT_ID || ''
};


