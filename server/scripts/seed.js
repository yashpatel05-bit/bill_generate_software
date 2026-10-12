require('dotenv').config()
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const Admin = require('../models/Admin')
const Restaurant = require('../models/Restaurant')
const MenuCategory = require('../models/MenuCategory')
const MenuItem = require('../models/MenuItem')
const RestaurantTable = require('../models/RestaurantTable')
const Invoice = require('../models/Invoice')
const Order = require('../models/Order')
const InvoiceSequence = require('../models/InvoiceSequence')
const connectDB = require('../config/db')

;(async () => {
  try {
    await connectDB()

    // Clear existing data
    await Admin.deleteMany({})
    await Restaurant.deleteMany({})
    await MenuCategory.deleteMany({})
    await MenuItem.deleteMany({})
    await RestaurantTable.deleteMany({})
    await Invoice.deleteMany({})
    await Order.deleteMany({})
    await InvoiceSequence.deleteMany({})

    // Create Admin
    const adminPasswordHash = await bcrypt.hash('admin123', 12)
    const admin = new Admin({
      name: 'Admin User',
      email: 'admin@billor.com',
      password: adminPasswordHash,
    })
    await admin.save()
    console.log('Admin created:', admin.email)

    // Create 6 demonstration restaurants
    const restaurantsData = [
      {
        name: 'Tea Post',
        cuisine: 'Tea & Snacks',
        address: { street: '123 Tea Garden Rd', city: 'Mumbai', state: 'Maharashtra', postalCode: '400001', country: 'India' },
        phone: '+91 22 2345 6789',
        logo: 'https://lucide.dev/icons/tea',
        primaryColor: '#ff6b35',
        secondaryColor: '#10b981',
        invoiceFooter: 'Thank you for chai with us!',
      },
      {
        name: 'Banne Dosa',
        cuisine: 'South Indian',
        address: { street: '456 Temple St', city: 'Bangalore', state: 'Karnataka', postalCode: '560001', country: 'India' },
        phone: '+91 80 2345 6789',
        logo: 'https://lucide.dev/icons/pizza-slice',
        primaryColor: '#dc2626',
        secondaryColor: '#6366f1',
        invoiceFooter: 'Food is our love made edible!',
      },
      {
        name: 'D Pizza',
        cuisine: 'Italian',
        address: { street: '789 Pizza St', city: 'Delhi', state: 'Delhi', postalCode: '110001', country: 'India' },
        phone: '+91 11 2345 6789',
        logo: 'https://lucide.dev/icons/pizza-slice',
        primaryColor: '#ef4444',
        secondaryColor: '#f59e0b',
        invoiceFooter: 'Made with love and dough!',
      },
      {
        name: 'Burger Farm',
        cuisine: 'American',
        address: { street: '321 Farm Rd', city: 'Pune', state: 'Maharashtra', postalCode: '411001', country: 'India' },
        phone: '+91 20 2345 6789',
        logo: 'https://lucide.dev/icons/hamburger',
        primaryColor: '#dc2626',
        secondaryColor: '#6366f1',
        invoiceFooter: 'Fresh from the farm!',
      },
      {
        name: 'Honest Restaurant',
        cuisine: 'Multi-Cuisine',
        address: { street: '654 Honest Ave', city: 'Chennai', state: 'Tamil Nadu', postalCode: '600001', country: 'India' },
        phone: '+91 44 2345 6789',
        logo: 'https://lucide.dev/icons/dish',
        primaryColor: '#059669',
        secondaryColor: '#ec4899',
        invoiceFooter: 'Honest food, honest prices!',
      },
      {
        name: 'The Belgian Waffle Co.',
        cuisine: 'Belgian',
        address: { street: '989 Waffle Blvd', city: 'Kolkata', state: 'West Bengal', postalCode: '700001', country: 'India' },
        phone: '+91 33 2345 6789',
        logo: 'https://lucide.dev/icons/wind-solar',
        primaryColor: '#8b5cf6',
        secondaryColor: '#ec4899',
        invoiceFooter: 'Waffles make everything better!',
      },
    ]

    const restaurants = []
    for (const rData of restaurantsData) {
      const restaurant = new Restaurant({
        ...rData,
        status: 'open',
        taxConfiguration: {
          cgstRate: 2.5,
          sgstRate: 2.5,
        },
        createdBy: admin._id,
      })
      restaurant.slug = restaurant.name.toLowerCase().replace(/[\s]+/g, '-').replace(/[^a-z0-9-]/g, '')
      await restaurant.save()
      restaurants.push(restaurant)
      console.log('Restaurant created:', restaurant.name)
    }

    // Create menu categories and items for each restaurant
    const categoriesAndItems = {
      'Tea Post': [
        { name: 'Masala Tea', category: 'Beverages', price: 20, isVegetarian: true, preparationTime: 2 },
        { name: 'Green Tea', category: 'Beverages', price: 25, isVegetarian: true, preparationTime: 2 },
        { name: 'Samosa', category: 'Snacks', price: 30, isVegetarian: true, preparationTime: 5 },
        { name: 'Onion Pakora', category: 'Snacks', price: 35, isVegetarian: true, preparationTime: 5 },
        { name: 'Vada Pav', category: 'Snacks', price: 40, isVegetarian: true, preparationTime: 3 },
      ],
      'Banne Dosa': [
        { name: 'Masala Dosa', category: 'Main', price: 80, isVegetarian: true, preparationTime: 10 },
        { name: 'Set Dosa', category: 'Main', price: 60, isVegetarian: true, preparationTime: 8 },
        { name: 'Idli Sambar', category: 'Main', price: 70, isVegetarian: true, preparationTime: 10 },
        { name: 'Vada Sambar', category: 'Main', price: 65, isVegetarian: true, preparationTime: 8 },
        { name: 'Medu Vada', category: 'Snacks', price: 45, isVegetarian: true, preparationTime: 5 },
      ],
      'D Pizza': [
        { name: 'Margherita Pizza', category: 'Pizza', price: 250, isVegetarian: true, preparationTime: 15 },
        { name: 'Pepperoni Pizza', category: 'Pizza', price: 300, isVegetarian: false, preparationTime: 15 },
        { name: 'Vegetable Pizza', category: 'Pizza', price: 280, isVegetarian: true, preparationTime: 15 },
        { name: 'Garlic Bread', category: 'Starters', price: 150, isVegetarian: true, preparationTime: 10 },
        { name: 'Chocolate Brownie', category: 'Dessert', price: 80, isVegetarian: true, preparationTime: 5 },
      ],
      'Burger Farm': [
        { name: 'Cheeseburger', category: 'Burgers', price: 180, isVegetarian: false, preparationTime: 8 },
        { name: 'Veggie Burger', category: 'Burgers', price: 160, isVegetarian: true, preparationTime: 8 },
        { name: 'Fries', category: 'Sides', price: 80, isVegetarian: true, preparationTime: 5 },
        { name: 'Milkshake', category: 'Drinks', price: 100, isVegetarian: true, preparationTime: 3 },
        { name: 'Chicken Burger', category: 'Burgers', price: 220, isVegetarian: false, preparationTime: 8 },
      ],
      'Honest Restaurant': [
        { name: 'Chicken Curry', category: 'Main', price: 250, isVegetarian: false, preparationTime: 20 },
        { name: 'Dal Tadka', category: 'Main', price: 180, isVegetarian: true, preparationTime: 15 },
        { name: 'Butter Naan', category: 'Bread', price: 60, isVegetarian: true, preparationTime: 5 },
        { name: 'Rice', category: 'Main', price: 80, isVegetarian: true, preparationTime: 5 },
        { name: 'Gulab Jamun', category: 'Dessert', price: 70, isVegetarian: true, preparationTime: 5 },
      ],
      'The Belgian Waffle Co.': [
        { name: 'Belgian Waffle', category: 'Waffles', price: 200, isVegetarian: true, preparationTime: 10 },
        { name: 'Strawberry Waffle', category: 'Waffles', price: 220, isVegetarian: true, preparationTime: 10 },
        { name: 'Chocolate Waffle', category: 'Waffles', price: 230, isVegetarian: true, preparationTime: 10 },
        { name: 'Coffee', category: 'Beverages', price: 30, isVegetarian: true, preparationTime: 3 },
        { name: 'Hot Chocolate', category: 'Beverages', price: 45, isVegetarian: true, preparationTime: 5 },
      ],
    }

    for (const restaurant of restaurants) {
      const categoryData = categoriesAndItems[restaurant.name]

      // Create categories
      const categories = []
      for (const catData of categoryData) {
        const category = new MenuCategory({
          name: catData.category,
          restaurant: restaurant._id,
        })
        category.slug = catData.category.toLowerCase().replace(/[\s]+/g, '-').replace(/[^a-z0-9-]/g, '')
        await category.save()
        categories.push(category._id)
      }

      // Create menu items
      for (let i = 0; i < categoryData.length; i++) {
        const itemData = categoryData[i]
        const category = categories[i % categories.length]

        const menuItem = new MenuItem({
          name: itemData.name,
          description: `${itemData.name} - fresh and delicious`,
          sellingPrice: itemData.price,
          restaurant: restaurant._id,
          category: category,
          isVegetarian: itemData.isVegetarian,
          preparationTime: itemData.preparationTime,
          stock: 999,
          sku: `${restaurant.slug.substring(0, 2).toUpperCase()}-${itemData.name.toLowerCase().replace(/\s+/g, '-').substring(0, 3)}-${i + 1}`,
        })
        menuItem.slug = itemData.name.toLowerCase().replace(/[\s]+/g, '-').replace(/[^a-z0-9-]/g, '')

        await menuItem.save()
      }
      console.log(`Menu items created for ${restaurant.name}`)
    }

    // Create tables for each restaurant
    for (const restaurant of restaurants) {
      const tables = [
        { name: 'Table 1', capacity: 2 },
        { name: 'Table 2', capacity: 4 },
        { name: 'Table 3', capacity: 6 },
      ]

      for (const tableData of tables) {
        const table = new RestaurantTable({
          ...tableData,
          restaurant: restaurant._id,
          status: 'available',
        })
        await table.save()
      }
      console.log(`Tables created for ${restaurant.name}`)
    }

    // Create invoice sequence entry for first restaurant
    await InvoiceSequence.create({ restaurant: restaurants[0]._id, current: 0 })

    console.log('\nSeed completed successfully!')
    console.log('Admin credentials:')
    console.log('Email: admin@billor.com')
    console.log('Password: admin123')
    console.log('\nSix demonstration restaurants seeded.')

    process.exit(0)
  } catch (error) {
    console.error('Seed error:', error)
    process.exit(1)
  }
})()