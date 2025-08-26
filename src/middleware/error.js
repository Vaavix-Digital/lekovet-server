const { env } = require('../config');

function errorHandler(err, req, res, next) {
	const status = err.status || 500;
	const message = err.message || 'Internal Server Error';
	const payload = { error: message };
	if (env !== 'production') {
		payload.stack = err.stack;
	}
	res.status(status).json(payload);
}

module.exports = { errorHandler };


