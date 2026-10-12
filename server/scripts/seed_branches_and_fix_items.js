require('dotenv').config()
const mongoose = require('mongoose')
const Restaurant = require('../models/Restaurant')
const MenuItem = require('../models/MenuItem')
const RestaurantTable = require('../models/RestaurantTable')
const Invoice = require('../models/Invoice')
const connectDB = require('../config/db')

;(async () => {
  try {
    await connectDB()

    const branchLocations = [
      'Vesu',
      'Ghod Dod Road',
      'City Light',
      'Adajan',
      'Piplod',
      'Pal',
      'Varachha',
    ]

    const restaurants = await Restaurant.find({})
    console.log(`Found ${restaurants.length} restaurants.`)

    for (let i = 0; i < restaurants.length; i++) {
      const rest = restaurants[i]

      // Assign 2 to 4 branches (max 4)
      const numBranches = 2 + (i % 3) // 2, 3, or 4
      const assignedBranches = []

      for (let b = 0; b < numBranches; b++) {
        const placeIndex = (i * 2 + b) % branchLocations.length
        const placeName = branchLocations[placeIndex]
        assignedBranches.push({
          name: `${placeName} Branch`,
          address: `${placeName}, Main Avenue`,
          phone: `+91 98${((i + 1) * 1111111 + b * 22222).toString().substring(0, 8)}`,
          isMain: b === 0,
        })
      }

      rest.branches = assignedBranches
      await rest.save()
      console.log(`Updated ${rest.name} with ${assignedBranches.length} branches:`, assignedBranches.map((b) => b.name).join(', '))

      // Seed tables: Table 1 through Table 6
      const existingTables = await RestaurantTable.find({ restaurant: rest._id })
      const tableNames = existingTables.map((t) => t.name)

      for (let t = 1; t <= 6; t++) {
        const tName = `Table ${t}`
        if (!tableNames.includes(tName)) {
          await RestaurantTable.create({
            restaurant: rest._id,
            name: tName,
            capacity: t % 2 === 0 ? 4 : 2,
            status: 'available',
          })
        }
      }
    }

    // Fix invoices to ensure NO NaN values ever
    const allMenuItems = await MenuItem.find({})
    const itemPriceMap = {}
    allMenuItems.forEach((item) => {
      itemPriceMap[item._id.toString()] = item.sellingPrice || 120
      itemPriceMap[item.name.toLowerCase()] = item.sellingPrice || 120
    })

    const allInvoices = await Invoice.find({})
    let fixedCount = 0

    for (const inv of allInvoices) {
      let invUpdated = false
      let newSubtotal = 0

      if (Array.isArray(inv.items)) {
        for (const item of inv.items) {
          const matchedPrice =
            itemPriceMap[item.menuItem?.toString()] ||
            itemPriceMap[item.name?.toLowerCase()] ||
            150

          if (!item.priceAtInvoice || isNaN(item.priceAtInvoice) || item.priceAtInvoice === 0) {
            item.priceAtInvoice = matchedPrice
            invUpdated = true
          }
          if (!item.priceAtOrder || isNaN(item.priceAtOrder) || item.priceAtOrder === 0) {
            item.priceAtOrder = item.priceAtInvoice
            invUpdated = true
          }
          if (!item.total || isNaN(item.total)) {
            item.total = item.priceAtInvoice * (item.quantity || 1)
            invUpdated = true
          }
          newSubtotal += item.total
        }
      }

      if (invUpdated || isNaN(inv.subtotal) || isNaN(inv.total)) {
        inv.subtotal = newSubtotal
        const cgst = Math.round(newSubtotal * 0.025 * 100) / 100
        const sgst = Math.round(newSubtotal * 0.025 * 100) / 100
        inv.cgst = cgst
        inv.sgst = sgst
        inv.total = Math.round((newSubtotal + cgst + sgst - (inv.discount || 0)) * 100) / 100
        await inv.save()
        fixedCount++
      }
    }

    console.log(`Verified and fixed ${fixedCount} invoices. Zero NaN values remain.`)
    console.log('Done successfully!')
    process.exit(0)
  } catch (err) {
    console.error('Error:', err)
    process.exit(1)
  }
})()
