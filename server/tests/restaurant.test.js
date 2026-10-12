const request = require('supertest')
const mongoose = require('mongoose')
const app = require('../index.js')

describe('Restaurant Management', () => {
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

  describe('GET /api/restaurants', () => {
    it('should return empty list when no restaurants', async () => {
      const res = await request(app).get('/api/restaurants')
      expect(res.statusCode).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.restaurants).toHaveLength(0)
    })
  })

  describe('POST /api/restaurants', () => {
    it('should create a new restaurant', async () => {
      const res = await request(app)
        .post('/api/restaurants')
        .send({
          name: 'New Restaurant',
          cuisine: 'North Indian',
          address: { street: '123 New St', city: 'New Delhi', state: 'Delhi', postalCode: '110001', country: 'India' },
          phone: '+91 11 2345 6789',
        })
      expect(res.statusCode).toBe(201)
      expect(res.body.success).toBe(true)
      expect(res.body.restaurant.name).toBe('New Restaurant')
    })

    it('should fail without restaurant name', async () => {
      const res = await request(app).post('/api/restaurants').send({})
      expect(res.statusCode).toBe(500)
    })
  })

  describe('PATCH /api/restaurants/:id', () => {
    it('should update a restaurant', async () => {
      const createRes = await request(app)
        .post('/api/restaurants')
        .send({ name: 'Updater', cuisine: 'Test' })

      const updateRes = await request(app)
        .patch(`/api/restaurants/${createRes.body.restaurant._id}`)
        .send({ name: 'Updated Name' })

      expect(updateRes.statusCode).toBe(200)
      expect(updateRes.body.success).toBe(true)
      expect(updateRes.body.restaurant.name).toBe('Updated Name')
    })

    it('should fail with invalid ID', async () => {
      const res = await request(app).patch('/api/restaurants/invalid-id').send({ name: 'Test' })
      expect(res.statusCode).toBe(404)
    })
  })

  describe('DELETE /api/restaurants/:id', () => {
    it('should delete a restaurant', async () => {
      const createRes = await request(app)
        .post('/api/restaurants')
        .send({ name: 'ToDelete', cuisine: 'Test' })

      const deleteRes = await request(app).delete(`/api/restaurants/${createRes.body.restaurant._id}`)
      expect(deleteRes.statusCode).toBe(200)
      expect(deleteRes.body.success).toBe(true)
    })

    it('should fail with invalid ID', async () => {
      const res = await request(app).delete('/api/restaurants/invalid-id')
      expect(res.statusCode).toBe(404)
    })
  })
})