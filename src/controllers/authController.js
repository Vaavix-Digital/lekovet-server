const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { jwtSecret, googleClientId } = require('../config');
const User = require('../models/user.model');
const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client(googleClientId);

function createToken(user) {
	return jwt.sign({ sub: user._id.toString(), role: user.role }, jwtSecret, { expiresIn: '7d' });
}

exports.register = async (req, res) => {
	const { name, email, password, phone, role } = req.body || {};
	if (!email || !password) return res.status(400).json({ error: 'email and password required' });
	if (role && !['user', 'admin'].includes(role)) return res.status(400).json({ error: 'invalid role' });
	const existing = await User.findOne({ email });
	if (existing) {
		if (existing.provider === 'google') {
			return res.status(409).json({ error: 'email registered with Google. Use Google login.' });
		}
		return res.status(409).json({ error: 'email already registered' });
	}
	const hash = await bcrypt.hash(password, 10);
	const user = await User.create({
		name: name || email.split('@')[0],
		email,
		phone,
		password: hash,
		provider: 'local',
		role: role || 'user'
	});
	return res.status(201).json({ id: user._id, role: user.role });
};

exports.login = async (req, res) => {
	const { email, password } = req.body || {};
	if (!email || !password) return res.status(400).json({ error: 'email and password required' });
	const user = await User.findOne({ email });
	if (!user) return res.status(401).json({ error: 'invalid credentials' });
	const ok = await bcrypt.compare(password, user.password);
	if (!ok) return res.status(401).json({ error: 'invalid credentials' });
	const token = createToken(user);
	return res.json({
		token,
		id: user._id,
		name: user.name,
		// email: user.email,
		role: user.role
	});
};

exports.googleLogin = async (req, res) => {
	const { idToken } = req.body || {};
	if (!idToken) return res.status(400).json({ error: 'idToken required' });
	if (!googleClientId) return res.status(500).json({ error: 'Google client not configured' });

	let ticket;
	try {
		ticket = await googleClient.verifyIdToken({ idToken, audience: googleClientId });
	} catch (err) {
		return res.status(401).json({ error: 'invalid google token' });
	}

	const payload = ticket.getPayload();
	const googleId = payload.sub;
	const email = payload.email;
	const name = payload.name || payload.given_name || 'Google User';

	let user = await User.findOne({ email });
	if (!user) {
		user = await User.create({
			name,
			email,
			provider: 'google',
			googleId,
			role: 'user'
		});
	} else if (user.provider !== 'google') {
		// Allow linking in future, but for now prevent conflicting providers
		return res.status(409).json({ error: 'email already registered with password' });
	} else if (!user.googleId) {
		user.googleId = googleId;
		await user.save();
	}

	const token = createToken(user);
	return res.json({
		token,
		id: user._id,
		name: user.name,
		// email: user.email,
		role: user.role
	});
};


