// Simple in-memory data store for demo; replace with a database later
let nextUserId = 1;
let nextProductId = 1;

const users = [];
const products = [];
const userCarts = new Map(); // userId -> [{ productId, quantity }]
const userFavorites = new Map(); // userId -> [productId]

module.exports = {
	users,
	products,
	userCarts,
	userFavorites,
	getNextUserId: () => nextUserId++,
	getNextProductId: () => nextProductId++
};


