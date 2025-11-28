const request = require('supertest');
const app = require('../src/app');
const prisma = require('./setup');

describe('Auth Endpoints', () => {
    let testUser = {
        email: 'test@example.com',
        password: 'Password123!'
    };

    // Clean up before running tests
    beforeAll(async () => {
        await prisma.user.deleteMany({ where: { email: testUser.email } });
    });

    afterAll(async () => {
        await prisma.user.deleteMany({ where: { email: testUser.email } });
    });

    it('should register a new user', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send(testUser);

        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('message');
        expect(res.body).toHaveProperty('userId');
    });

    it('should not register duplicate user', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send(testUser);

        expect(res.statusCode).toEqual(400);
    });

    // Note: Login test might fail if user is not verified. 
    // In a real test env, we would manually verify the user in DB first.
    it('should login successfully after verification', async () => {
        // Manually verify user
        await prisma.user.update({
            where: { email: testUser.email },
            data: { isVerified: true }
        });

        const res = await request(app)
            .post('/api/auth/login')
            .send(testUser);

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('accessToken');
        expect(res.body).toHaveProperty('refreshToken');
    });
});
