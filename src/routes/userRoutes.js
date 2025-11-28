const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const apicache = require('apicache');
let cache = apicache.middleware;

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management and RBAC testing
 */

/**
 * @swagger
 * /public/hello:
 *   get:
 *     summary: Public endpoint
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/public/hello', cache('5 minutes'), userController.getPublicHello);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 *       401:
 *         description: Unauthorized
 */
router.get('/auth/me', authMiddleware, userController.getMe);

/**
 * @swagger
 * /admin/dashboard:
 *   get:
 *     summary: Admin dashboard (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin dashboard data
 *       403:
 *         description: Forbidden
 */
router.get('/admin/dashboard', authMiddleware, roleMiddleware(['ADMIN']), userController.getAdminDashboard);

/**
 * @swagger
 * /moderator/panel:
 *   get:
 *     summary: Moderator panel (Admin + Moderator)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Moderator panel data
 *       403:
 *         description: Forbidden
 */
router.get('/moderator/panel', authMiddleware, roleMiddleware(['ADMIN', 'MODERATOR']), userController.getModeratorPanel);

module.exports = router;
