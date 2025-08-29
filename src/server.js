const { env, port, mongoUri } = require('./config');
const { connectMongo } = require('./db/mongo');
const app = require('./app');

connectMongo(mongoUri)
	.then(() => {
		app.listen(port,'0.0.0.0', () => {
			console.log(`API listening on port ${port} (${env})`);
		});
	})
	.catch((err) => {
		console.error('Failed to connect to MongoDB:', err.message);
		process.exit(1);
	});


