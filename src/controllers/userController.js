const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Public Route
const getPublicHello = (req, res) => {
    res.json({ message: 'Hello from public endpoint! Anyone can see this.' });
};

// Protected Route (Any Authenticated User)
const getMe = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: { id: true, email: true, role: true, isVerified: true, createdAt: true }
        });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Admin Route
const getAdminDashboard = (req, res) => {
    res.json({ message: 'Welcome to the Admin Dashboard! Only Admins can see this.' });
};

// Moderator Route
const getModeratorPanel = (req, res) => {
    res.json({ message: 'Welcome to the Moderator Panel! Admins and Moderators can see this.' });
};

module.exports = {
    getPublicHello,
    getMe,
    getAdminDashboard,
    getModeratorPanel
};
