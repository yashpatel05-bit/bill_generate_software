const request = require('supertest')
const mongoose = require('mongoose')
const app = require('../index.js')

describe('Admin Authentication', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/billu_test')
  })

  afterAll(async () => {
    await mongoose.connection.close()
    await app.close()
  })

  beforeEach(async () => {
    await mongoose.connection.db.dropDatabase()
  })

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@billor.com', password: 'admin123' })
      expect(res.statusCode).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.admin).toBeDefined()
      expect(res.body.token).toBeDefined()
    })

    it('should fail with invalid password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@billor.com', password: 'wrongpassword' })
      expect(res.statusCode).toBe(401)
      expect(res.body.success).toBe(false)
      expect(res.body.message).toBe('Invalid credentials')
    })

    it('should fail with non-existent user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nonexistent@test.com', password: 'password' })
      expect(res.statusCode).toBe(401)
      expect(res.body.success).toBe(false)
    })
  })

  describe('GET /api/auth/me', () => {
    it('should get admin profile with valid token', async () => {
      // First login to get token
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@billor.com', password: 'admin123' })

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${loginRes.body.token}`)

      expect(res.statusCode).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.admin.email).toBe('admin@billor.com')
    })

    it('should fail without token', async () => {
      const res = await request(app).get('/api/auth/me')
      expect(res.statusCode).toBe(401)
    })
  })

  describe('POST /api/auth/logout', () => {
    it('should logout and clear cookie', async () => {
      const res = await request(app).post('/api/auth/logout')
      expect(res.statusCode).toBe(200)
      expect(res.body.success).toBe(true)
    })
  })
})