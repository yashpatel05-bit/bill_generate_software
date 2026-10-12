require('dotenv').config()
const mongoose = require('mongoose')
const Restaurant = require('../models/Restaurant')
const MenuItem = require('../models/MenuItem')
const Invoice = require('../models/Invoice')
const Order = require('../models/Order')
const connectDB = require('../config/db')

;(async () => {
  try {
    await connectDB()

    const restaurants = await Restaurant.find({})
    if (restaurants.length === 0) {
      console.log('No restaurants found. Run seed.js first.')
      process.exit(1)
    }

    // Clear existing invoices and orders to ensure clean, consistent data
    await Invoice.deleteMany({})
    await Order.deleteMany({})

    const customerNames = [
      'Aarav Sharma',
      'Priya Patel',
      'Rohan Gupta',
      'Ananya Iyer',
      'Vikram Malhotra',
      'Sneha Verma',
      'Kabir Mehta',
      'Neha Joshi',
      'Arjun Nair',
      'Pooja Rao',
    ]

    const paymentMethods = ['cash', 'card', 'upi']
    let invoiceCount = 0

    // Seed realistic invoices across the last 7 days for each restaurant
    for (const restaurant of restaurants) {
      const items = await MenuItem.find({ restaurant: restaurant._id })
      if (items.length === 0) continue

      // Determine an outlet base volume for nice realistic chart distribution
      // E.g. Burger Farm ~ ₹1800, D Pizza ~ ₹1450, Belgian Waffle ~ ₹720, etc.
      let numBills = 4
      if (restaurant.name.includes('Burger')) numBills = 7
      else if (restaurant.name.includes('Pizza')) numBills = 6
      else if (restaurant.name.includes('Waffle')) numBills = 4
      else if (restaurant.name.includes('Banne')) numBills = 4
      else if (restaurant.name.includes('Tea')) numBills = 5
      else numBills = 3

      for (let dayOffset = 6; dayOffset >= 0; dayOffset--) {
        const date = new Date()
        date.setDate(date.getDate() - dayOffset)
        date.setHours(12 + (dayOffset % 8), (dayOffset * 17) % 60, 0, 0)

        // Number of orders on this day
        const dailyOrders = Math.max(1, Math.round(numBills * (0.8 + ((dayOffset * 3) % 5) * 0.1)))

        for (let b = 0; b < dailyOrders; b++) {
          invoiceCount++
          const customer = customerNames[(invoiceCount + dayOffset) % customerNames.length]
          const chosenItem1 = items[b % items.length]
          const chosenItem2 = items[(b + 1) % items.length]

          const qty1 = (b % 2) + 1
          const qty2 = (b % 3 === 0) ? 1 : 0

          const invoiceItems = [
            {
              menuItem: chosenItem1._id,
              name: chosenItem1.name,
              quantity: qty1,
              priceAtInvoice: chosenItem1.sellingPrice,
              total: chosenItem1.sellingPrice * qty1,
            },
          ]

          if (qty2 > 0 && chosenItem2) {
            invoiceItems.push({
              menuItem: chosenItem2._id,
              name: chosenItem2.name,
              quantity: qty2,
              priceAtInvoice: chosenItem2.sellingPrice,
              total: chosenItem2.sellingPrice * qty2,
            })
          }

          const subtotal = invoiceItems.reduce((acc, it) => acc + it.total, 0)
          const cgst = Math.round(subtotal * 0.025 * 100) / 100
          const sgst = Math.round(subtotal * 0.025 * 100) / 100
          const total = Math.round((subtotal + cgst + sgst) * 100) / 100

          const invoiceDate = new Date(date)
          invoiceDate.setMinutes(date.getMinutes() + b * 25)

          const invNum = `${restaurant.slug ? restaurant.slug.substring(0, 3).toUpperCase() : 'INV'}-${1000 + invoiceCount}`

          const inv = new Invoice({
            restaurant: restaurant._id,
            invoiceNumber: invNum,
            customerName: customer,
            customerPhone: `+91 98${(10000000 + invoiceCount).toString().substring(0, 8)}`,
            orderType: b % 2 === 0 ? 'dine-in' : 'takeaway',
            tableNumber: b % 2 === 0 ? `T${(b % 4) + 1}` : undefined,
            items: invoiceItems,
            subtotal,
            cgst,
            sgst,
            discount: 0,
            total,
            paymentMethod: paymentMethods[b % paymentMethods.length],
            paymentStatus: 'paid',
            status: 'finalized',
            invoiceDate,
            createdAt: invoiceDate,
            updatedAt: invoiceDate,
          })

          await inv.save()
        }
      }
    }

    console.log(`Seeded ${invoiceCount} realistic invoices across all 6 restaurants.`)
    process.exit(0)
  } catch (err) {
    console.error('Error seeding invoices:', err)
    process.exit(1)
  }
})()
