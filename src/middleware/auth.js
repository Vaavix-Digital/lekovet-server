const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config');

function authenticate(req, res, next) {
	const authHeader = req.headers.authorization || '';
	const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
	if (!token) return res.status(401).json({ error: 'Missing token' });
	try {
		const payload = jwt.verify(token, jwtSecret);
		req.user = { id: payload.sub, role: payload.role };
		return next();
	} catch (err) {
		return res.status(401).json({ error: 'Invalid token' });
	}
}

function requireRole(role) {
	return (req, res, next) => {
		if (!req.user || req.user.role !== role) {
			return res.status(403).json({ error: `${role} only` });
		}
		next();
	};
}

module.exports = { authenticate, requireRole };


