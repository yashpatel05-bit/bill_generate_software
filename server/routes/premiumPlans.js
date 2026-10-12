const express = require('express')
const router = express.Router()
const PremiumPlan = require('../models/PremiumPlan')
const authenticate = require('../middleware/auth')

const DEFAULT_PLANS = [
  {
    name: 'Smart WhatsApp & SMS Digital Invoicing',
    code: 'whatsapp_invoicing',
    badge: 'Tier 1 • High ROI',
    price: 799,
    durationMonths: 3,
    headline: 'Cut thermal paper costs & message digital GST bills straight to customer phones in 2 seconds.',
    valueJustification:
      'Saves up to ₹1,500/quarterly in paper roll expenses while collecting verified customer phone numbers for repeat promotional broadcasts.',
    capabilities: [
      'Instant 1-Click WhatsApp digital invoice delivery with download link',
      'Automatic thank-you SMS containing order breakdown & GST summary',
      'Customer repeat marketing directory for festival & weekend offers',
      'Eco-friendly 100% paperless billing reducing printer hardware jams',
      'Custom restaurant branding & logo inside WhatsApp receipt preview',
    ],
    iconKey: 'MessageSquare',
    color: '#3E6842',
    bgLight: '#EEF4EE',
    accentBorder: '#D3E5D4',
    tabId: 'whatsapp',
    isActive: true,
    isFreeForAdmin: true,
    order: 1,
  },
  {
    name: 'AI Inventory Forecaster & Low-Stock Auto-Alerts',
    code: 'ai_inventory',
    badge: 'Tier 2 • Waste Reducer',
    price: 1199,
    durationMonths: 3,
    headline: 'Prevent ingredient stock-outs & eliminate kitchen food wastage with auto-depletion tracking.',
    valueJustification:
      'Reduces kitchen food spoilage by 25% and ensures chefs never run out of cheese, butter, or paneer during peak dinner rushes.',
    capabilities: [
      'Real-time raw material ingredient depletion linked directly to POS sales',
      '7-Day AI demand forecasting based on weekend surges & customer footfall',
      'Urgent Low-Stock automatic alerts triggered on safety buffer limits',
      'Automated vendor purchase order sheets with 1-click re-stocking',
      'Kitchen shrinkage & food spoilage tracking audit reports',
    ],
    iconKey: 'Boxes',
    color: '#8A7969',
    bgLight: '#FAF5EE',
    accentBorder: '#EFE5D7',
    tabId: 'inventory',
    isActive: true,
    isFreeForAdmin: true,
    order: 2,
  },
  {
    name: 'Multi-Branch Live Sync & Kitchen Display System (KDS)',
    code: 'kds_multi_branch',
    badge: 'Tier 3 • Enterprise',
    price: 1599,
    durationMonths: 3,
    headline: 'Seamless chef kitchen screen management and simultaneous pricing sync across all branches.',
    valueJustification:
      'Connects all kitchen stations without messy paper chits and synchronizes menu prices and revenue live across Vesu, Ghod Dod, and City Light outlets.',
    capabilities: [
      'Digital chef Kitchen Display Screen (KDS) with live cooking timer',
      'Bump-order workflow for kitchen prep speed & delayed ticket alerts',
      'Live Multi-Branch Menu & Price Sync across all 2-4 branch outlets',
      'Contactless Table QR Digital Menu code ordering directly to POS',
      'Cross-branch customer VIP loyalty rewards & points redemption',
    ],
    iconKey: 'Tv',
    color: '#758C76',
    bgLight: '#FAF8F5',
    accentBorder: '#E8E1D7',
    tabId: 'kds',
    isActive: true,
    isFreeForAdmin: true,
    order: 3,
  },
]

// Seed helper
async function ensureDefaultPlans() {
  const count = await PremiumPlan.countDocuments()
  if (count === 0) {
    await PremiumPlan.insertMany(DEFAULT_PLANS)
  }
}

// 1. GET ALL PLANS (Auto-seeds if none exist)
router.get('/', async (req, res) => {
  try {
    await ensureDefaultPlans()
    const plans = await PremiumPlan.find().sort({ order: 1, createdAt: 1 })
    res.json({ success: true, count: plans.length, plans })
  } catch (err) {
    console.error('Error fetching premium plans:', err)
    res.status(500).json({ success: false, message: 'Server error fetching premium plans' })
  }
})

// 2. GET SINGLE PLAN
router.get('/:id', async (req, res) => {
  try {
    const plan = await PremiumPlan.findById(req.params.id)
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found' })
    }
    res.json({ success: true, plan })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

// 3. CREATE PLAN (Admin CRUD - Create)
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      name,
      code,
      price,
      durationMonths,
      badge,
      headline,
      valueJustification,
      capabilities,
      iconKey,
      color,
      bgLight,
      accentBorder,
      tabId,
      isActive,
      isFreeForAdmin,
      order,
    } = req.body

    if (!name || !price) {
      return res.status(400).json({ success: false, message: 'Plan name and price are required' })
    }

    // Generate unique code if missing
    let cleanCode = (code || name.toLowerCase().replace(/[^a-z0-9]+/g, '_')).trim()
    const existing = await PremiumPlan.findOne({ code: cleanCode })
    if (existing) {
      cleanCode = `${cleanCode}_${Date.now().toString().slice(-4)}`
    }

    const newPlan = new PremiumPlan({
      name: name.trim(),
      code: cleanCode,
      price: Number(price),
      durationMonths: Number(durationMonths) || 3,
      badge: badge?.trim() || 'PRO MODULE',
      headline: headline?.trim() || '',
      valueJustification: valueJustification?.trim() || '',
      capabilities: Array.isArray(capabilities)
        ? capabilities.filter(Boolean)
        : typeof capabilities === 'string'
        ? capabilities.split('\n').map((s) => s.trim()).filter(Boolean)
        : [],
      iconKey: iconKey || 'Sparkles',
      color: color || '#758C76',
      bgLight: bgLight || '#FAF8F5',
      accentBorder: accentBorder || '#E8E1D7',
      tabId: tabId || 'plans',
      isActive: isActive !== undefined ? isActive : true,
      isFreeForAdmin: isFreeForAdmin !== undefined ? isFreeForAdmin : true,
      order: Number(order) || 10,
    })

    await newPlan.save()
    res.status(201).json({ success: true, message: 'Premium feature plan created successfully', plan: newPlan })
  } catch (err) {
    console.error('Error creating premium plan:', err)
    res.status(500).json({ success: false, message: err.message || 'Server error creating premium plan' })
  }
})

// 4. UPDATE PLAN (Admin CRUD - Update)
router.put('/:id', authenticate, async (req, res) => {
  try {
    const {
      name,
      code,
      price,
      durationMonths,
      badge,
      headline,
      valueJustification,
      capabilities,
      iconKey,
      color,
      bgLight,
      accentBorder,
      tabId,
      isActive,
      isFreeForAdmin,
      order,
    } = req.body

    const plan = await PremiumPlan.findById(req.params.id)
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found' })
    }

    if (name) plan.name = name.trim()
    if (code) plan.code = code.toLowerCase().trim()
    if (price !== undefined) plan.price = Number(price)
    if (durationMonths !== undefined) plan.durationMonths = Number(durationMonths)
    if (badge !== undefined) plan.badge = badge.trim()
    if (headline !== undefined) plan.headline = headline.trim()
    if (valueJustification !== undefined) plan.valueJustification = valueJustification.trim()
    if (capabilities !== undefined) {
      plan.capabilities = Array.isArray(capabilities)
        ? capabilities.filter(Boolean)
        : typeof capabilities === 'string'
        ? capabilities.split('\n').map((s) => s.trim()).filter(Boolean)
        : []
    }
    if (iconKey) plan.iconKey = iconKey
    if (color) plan.color = color
    if (bgLight) plan.bgLight = bgLight
    if (accentBorder) plan.accentBorder = accentBorder
    if (tabId) plan.tabId = tabId
    if (isActive !== undefined) plan.isActive = Boolean(isActive)
    if (isFreeForAdmin !== undefined) plan.isFreeForAdmin = Boolean(isFreeForAdmin)
    if (order !== undefined) plan.order = Number(order)

    await plan.save()
    res.json({ success: true, message: 'Premium plan updated successfully', plan })
  } catch (err) {
    console.error('Error updating premium plan:', err)
    res.status(500).json({ success: false, message: err.message || 'Server error updating plan' })
  }
})

// 5. DELETE PLAN (Admin CRUD - Delete)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const plan = await PremiumPlan.findByIdAndDelete(req.params.id)
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found' })
    }
    res.json({ success: true, message: `Premium feature plan "${plan.name}" deleted successfully` })
  } catch (err) {
    console.error('Error deleting premium plan:', err)
    res.status(500).json({ success: false, message: 'Server error deleting plan' })
  }
})

// 6. TOGGLE STATUS (Active/Paused)
router.post('/:id/toggle', authenticate, async (req, res) => {
  try {
    const plan = await PremiumPlan.findById(req.params.id)
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found' })
    }
    plan.isActive = !plan.isActive
    await plan.save()
    res.json({ success: true, message: `Plan status set to ${plan.isActive ? 'Active' : 'Paused'}`, plan })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error toggling status' })
  }
})

// 7. RESTORE / SEED DEFAULTS
router.post('/seed', authenticate, async (req, res) => {
  try {
    await PremiumPlan.deleteMany({})
    const created = await PremiumPlan.insertMany(DEFAULT_PLANS)
    res.json({ success: true, message: 'Default premium plans successfully restored', plans: created })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error restoring defaults' })
  }
})

module.exports = router
