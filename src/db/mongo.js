const mongoose = require('mongoose');
const { env } = require('../config');

async function connectMongo(uri) {
	if (!uri) throw Object.assign(new Error('MONGO_URI is missing'), { status: 500 });
	mongoose.set('strictQuery', true);
	await mongoose.connect(uri, { autoIndex: env !== 'production' });
	return mongoose.connection;
}

module.exports = { connectMongo };


