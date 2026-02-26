require('dotenv').config()

const path = require('path')
const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
const multer = require('multer')
const jwt = require('jsonwebtoken')
const cloudinary = require('cloudinary').v2
const axios = require('axios')
const Card = require('./models/Card')
const PendingChange = require('./models/PendingChange')

const app = express()
// Dashboard auth: set ADMIN_USERNAME, ADMIN_PASSWORD, JWT_SECRET in production
const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production'
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin'

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) {
    return res.status(401).json({ message: 'Authentication required' })
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.user = decoded
    next()
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' })
  }
}

app.use(
  cors({
    origin: '*',
  }),
)
app.use(express.json())

const PORT = process.env.PORT || 5070
const MONGODB_URI = process.env.MONGODB_URI

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB')
  })
  .catch((err) => {
    console.error('MongoDB connection error', err)
  })

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const upload = multer({ storage: multer.memoryStorage() })

async function deleteCardAndCloudinaryImages(cardId) {
  const card = await Card.findById(cardId)
  if (!card) return null
  if (card.cloudinaryPublicId) {
    try {
      await cloudinary.uploader.destroy(card.cloudinaryPublicId)
    } catch (err) {
      console.error('Failed to delete Cloudinary image (front)', err)
    }
  }
  if (card.cloudinaryPublicIdBack) {
    try {
      await cloudinary.uploader.destroy(card.cloudinaryPublicIdBack)
    } catch (err) {
      console.error('Failed to delete Cloudinary image (back)', err)
    }
  }
  await Card.findByIdAndDelete(cardId)
  return card
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.get('/api/cards', async (req, res) => {
  try {
    const cards = await Card.find().sort({ createdAt: -1 })
    res.json(cards)
  } catch (err) {
    console.error('Error fetching cards', err)
    res.status(500).json({ message: 'Failed to fetch cards' })
  }
})

app.get('/api/cards/:id', async (req, res) => {
  try {
    const card = await Card.findById(req.params.id)
    if (!card) return res.status(404).json({ message: 'Card not found' })
    res.json(card)
  } catch (err) {
    console.error('Error fetching card', err)
    res.status(500).json({ message: 'Failed to fetch card' })
  }
})

app.post('/api/cards', async (req, res) => {
  try {
    const card = await Card.create(req.body)
    res.status(201).json(card)
  } catch (err) {
    console.error('Error creating card', err)
    res.status(400).json({ message: 'Failed to create card' })
  }
})

app.put('/api/cards/:id', async (req, res) => {
  try {
    const card = await Card.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    })
    if (!card) return res.status(404).json({ message: 'Card not found' })
    res.json(card)
  } catch (err) {
    console.error('Error updating card', err)
    res.status(400).json({ message: 'Failed to update card' })
  }
})

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body || {}
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    const token = jwt.sign(
      { sub: 'admin', role: 'admin' },
      JWT_SECRET,
      { expiresIn: '7d' }
    )
    return res.json({ token })
  }
  res.status(401).json({ message: 'Invalid username or password' })
})

app.get('/api/pending-changes', requireAuth, async (req, res) => {
  try {
    const list = await PendingChange.find()
      .sort({ scheduledAt: 1 })
      .populate('cardId')
      .lean()
    res.json(list)
  } catch (err) {
    console.error('Error fetching pending changes', err)
    res.status(500).json({ message: 'Failed to fetch pending changes' })
  }
})

app.post('/api/pending-changes/:id/apply', requireAuth, async (req, res) => {
  try {
    const pending = await PendingChange.findById(req.params.id).populate('cardId')
    if (!pending) return res.status(404).json({ message: 'Pending change not found' })
    const cardId = pending.cardId?._id || pending.cardId
    if (!cardId) return res.status(400).json({ message: 'Invalid pending change' })

    if (pending.type === 'delete') {
      await deleteCardAndCloudinaryImages(cardId)
    } else if (pending.type === 'edit' && pending.payload) {
      const update = { ...pending.payload }
      delete update._id
      await Card.findByIdAndUpdate(cardId, update)
    }

    await PendingChange.findByIdAndDelete(pending._id)
    res.json({ success: true })
  } catch (err) {
    console.error('Error applying pending change', err)
    res.status(500).json({ message: 'Failed to apply change' })
  }
})

app.post('/api/pending-changes', async (req, res) => {
  try {
    const { type, cardId, payload } = req.body
    if (!type || !cardId) {
      return res.status(400).json({ message: 'type and cardId are required' })
    }
    if (!['edit', 'delete'].includes(type)) {
      return res.status(400).json({ message: 'type must be edit or delete' })
    }
    const card = await Card.findById(cardId)
    if (!card) return res.status(404).json({ message: 'Card not found' })
    const scheduledAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
    const pending = await PendingChange.create({
      type,
      cardId,
      payload: type === 'edit' ? payload : undefined,
      scheduledAt,
    })
    const populated = await PendingChange.findById(pending._id).populate('cardId').lean()
    res.status(201).json(populated)
  } catch (err) {
    console.error('Error creating pending change', err)
    res.status(400).json({ message: 'Failed to schedule change' })
  }
})

app.delete('/api/cards/:id', async (req, res) => {
  try {
    const card = await deleteCardAndCloudinaryImages(req.params.id)
    if (!card) return res.status(404).json({ message: 'Card not found' })
    res.status(204).end()
  } catch (err) {
    console.error('Error deleting card', err)
    res.status(500).json({ message: 'Failed to delete card' })
  }
})

app.post('/api/cards/upload-image', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No image file provided' })
  }
  try {
    const uploadResult = await cloudinary.uploader.upload_stream(
      { folder: 'visiting-cards' },
      (error, result) => {
        if (error || !result) {
          console.error('Cloudinary upload failed', error)
          return res.status(500).json({ message: 'Failed to upload image' })
        }
        return res.status(201).json({
          imageUrl: result.secure_url,
          publicId: result.public_id,
        })
      },
    )

    uploadResult.end(req.file.buffer)
  } catch (err) {
    console.error('Error in upload-image', err)
    res.status(500).json({ message: 'Failed to upload image' })
  }
})

function extractFieldsFromText(text) {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  const emailRegex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi
  const phoneRegex = /(\+?\d[\d\s\-]{7,}\d)/g
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|\b[^\s]+\.(com|in|net|org)\b)/gi

  const emails = text.match(emailRegex) || []
  const phones = text.match(phoneRegex) || []
  const websites = text.match(urlRegex) || []

  const metaKeywords = [
    'mobile',
    'mob',
    'phone',
    'email',
    'mail',
    'web',
    'www',
    '.com',
    '.in',
    'grade',
    'branch',
    'contact',
    'center',
    'centre',
  ]

  const isLikelyName = (line) => {
    if (!line) return false
    if (/\d/.test(line)) return false
    const lower = line.toLowerCase()
    if (metaKeywords.some((k) => lower.includes(k))) return false
    if (line.length > 40) return false
    return true
  }

  const isLikelyCompany = (line) => {
    if (!line) return false
    const hasDigits = /\d/.test(line)
    if (hasDigits) return false
    const lower = line.toLowerCase()
    if (lower.includes('mob') || lower.includes('email')) return false
    if (line.length > 60) return false
    return true
  }

  let name = ''
  let company = ''

  for (const line of lines) {
    if (!name && isLikelyName(line)) {
      name = line
      continue
    }
    if (!company && isLikelyCompany(line) && line !== name) {
      company = line
    }
  }

  // Very rough address guess: lines after phone/email that contain numbers and commas
  let address = ''
  const addressCandidates = lines.filter(
    (l) =>
      l.length > 10 &&
      /[0-9]/.test(l) &&
      (l.includes(',') || l.toLowerCase().includes('road') || l.toLowerCase().includes('nagar')),
  )
  if (addressCandidates.length) {
    address = addressCandidates.join(', ')
  }

  return {
    name,
    company,
    email: emails[0] || '',
    phone: phones[0] || '',
    website: websites[0] || '',
    address,
    // keep full OCR text so you can see everything in Notes
    notes: text,
  }
}

function mergeOcrResults(results) {
  const merged = {
    name: '',
    company: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    notes: '',
  }
  const notesParts = []
  for (const r of results) {
    if (r.name && !merged.name) merged.name = r.name
    if (r.company && !merged.company) merged.company = r.company
    if (r.email && !merged.email) merged.email = r.email
    if (r.phone && !merged.phone) merged.phone = r.phone
    if (r.website && !merged.website) merged.website = r.website
    if (r.address && !merged.address) merged.address = r.address
    if (r.notes) notesParts.push(r.notes)
  }
  merged.notes = notesParts.join('\n\n---\n\n')
  return merged
}

app.post('/api/cards/ocr', async (req, res) => {
  const { imageUrl, imageUrls } = req.body
  const urls = imageUrls && Array.isArray(imageUrls) && imageUrls.length > 0
    ? imageUrls
    : imageUrl
      ? [imageUrl]
      : []
  if (urls.length === 0) {
    return res.status(400).json({ message: 'imageUrl or imageUrls is required' })
  }

  const ocrUrl = process.env.OCR_API_URL
  const ocrKey = process.env.OCR_API_KEY

  if (!ocrUrl || !ocrKey) {
    return res
      .status(500)
      .json({ message: 'OCR service is not configured on the server' })
  }

  try {
    const results = []
    for (const imageUrl of urls) {
      const ocrResponse = await axios.post(
        `${ocrUrl}?key=${ocrKey}`,
        {
          requests: [
            {
              image: {
                source: { imageUri: imageUrl },
              },
              features: [{ type: 'TEXT_DETECTION' }],
            },
          ],
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      )
      const rawText =
        ocrResponse.data?.responses?.[0]?.fullTextAnnotation?.text || ''
      results.push(extractFieldsFromText(rawText))
    }
    const fields = urls.length > 1 ? mergeOcrResults(results) : results[0]
    res.json(fields)
  } catch (err) {
    console.error('Error calling OCR service', err)
    res.status(500).json({ message: 'Failed to parse card image' })
  }
})

// Serve frontend build (static files + SPA fallback)
const buildPath = path.join(__dirname, '..', 'frontend', 'dist')
app.use(express.static(buildPath))
// SPA fallback: serve index.html for non-API GET (regex avoids path-to-regexp strict syntax)
app.get(/^(?!\/api)/, (req, res) => {
  res.sendFile(path.join(buildPath, 'index.html'))
})

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`)
})

