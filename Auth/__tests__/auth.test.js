"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = require("../src/app");
const redis_1 = require("../src/redis");
// Ensure a clean Redis state before each test
beforeEach(async () => {
    const redis = (0, redis_1.getRedis)();
    await redis.flushall();
});
afterAll(async () => {
    await (0, redis_1.closeRedis)();
});
describe('Auth Service', () => {
    it('registers a new user and returns token + user', async () => {
        const res = await (0, supertest_1.default)(app_1.app)
            .post('/api/auth/register')
            .send({ name: 'Alice', email: 'alice@example.com', password: 'password' })
            .expect(201);
        expect(res.body.token).toBeDefined();
        expect(res.body.user).toMatchObject({
            name: 'Alice',
            email: 'alice@example.com',
        });
        expect(res.body.user.id).toBeDefined();
        expect(res.body.user.createdAt).toBeDefined();
    });
    it('prevents duplicate registration by email', async () => {
        await (0, supertest_1.default)(app_1.app)
            .post('/api/auth/register')
            .send({ name: 'Bob', email: 'bob@example.com', password: 'password' })
            .expect(201);
        const res = await (0, supertest_1.default)(app_1.app)
            .post('/api/auth/register')
            .send({ name: 'Bob 2', email: 'bob@example.com', password: 'password' })
            .expect(400);
        expect(res.body.error).toBeDefined();
    });
    it('logs in with correct credentials and rejects wrong ones', async () => {
        await (0, supertest_1.default)(app_1.app)
            .post('/api/auth/register')
            .send({ name: 'Carol', email: 'carol@example.com', password: 'secret123' })
            .expect(201);
        const ok = await (0, supertest_1.default)(app_1.app)
            .post('/api/auth/login')
            .send({ email: 'carol@example.com', password: 'secret123' })
            .expect(200);
        expect(ok.body.token).toBeDefined();
        await (0, supertest_1.default)(app_1.app)
            .post('/api/auth/login')
            .send({ email: 'carol@example.com', password: 'wrong' })
            .expect(400);
    });
    it('returns current user on /me with Bearer token', async () => {
        const reg = await (0, supertest_1.default)(app_1.app)
            .post('/api/auth/register')
            .send({ name: 'Dave', email: 'dave@example.com', password: 'password' })
            .expect(201);
        const token = reg.body.token;
        const me = await (0, supertest_1.default)(app_1.app)
            .get('/api/auth/me')
            .set('Authorization', `Bearer ${token}`)
            .expect(200);
        expect(me.body.user).toMatchObject({ email: 'dave@example.com', name: 'Dave' });
    });
    it('returns 401 on /me without token', async () => {
        await (0, supertest_1.default)(app_1.app)
            .get('/api/auth/me')
            .expect(401);
    });
});
