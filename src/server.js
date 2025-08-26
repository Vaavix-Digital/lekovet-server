const { env, port, mongoUri } = require('./config');
const { connectMongo } = require('./db/mongo');
const app = require('./app');

connectMongo(mongoUri)
	.then(() => {
		app.listen(port, () => {
			console.log(`API listening on port ${port} (${env})`);
		});
	})
	.catch((err) => {
		console.error('Failed to connect to MongoDB:', err.message);
		process.exit(1);
	});


