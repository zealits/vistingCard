require('dotenv').config()

const path = require('path')
const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
const multer = require('multer')
const cloudinary = require('cloudinary').v2
const axios = require('axios')
const Card = require('./models/Card')

const app = express()

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

app.delete('/api/cards/:id', async (req, res) => {
  try {
    const card = await Card.findByIdAndDelete(req.params.id)
    if (!card) return res.status(404).json({ message: 'Card not found' })
    if (card.cloudinaryPublicId) {
      try {
        await cloudinary.uploader.destroy(card.cloudinaryPublicId)
      } catch (err) {
        console.error('Failed to delete Cloudinary image', err)
      }
    }
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

app.post('/api/cards/ocr', async (req, res) => {
  const { imageUrl } = req.body
  if (!imageUrl) {
    return res.status(400).json({ message: 'imageUrl is required' })
  }

  const ocrUrl = process.env.OCR_API_URL
  const ocrKey = process.env.OCR_API_KEY

  if (!ocrUrl || !ocrKey) {
    return res
      .status(500)
      .json({ message: 'OCR service is not configured on the server' })
  }

  try {
    // Example for Google Vision API "images:annotate" with API key
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
    const fields = extractFieldsFromText(rawText)
    res.json(fields)
  } catch (err) {
    console.error('Error calling OCR service', err)
    res.status(500).json({ message: 'Failed to parse card image' })
  }
})

// Serve frontend build (static files + SPA fallback)
const buildPath = path.join(__dirname, '..', 'frontend', 'dist')
app.use(express.static(buildPath))
app.get('/(.*)', (req, res, next) => {
  // Skip API routes
  if (req.path.startsWith('/api')) return next()
  res.sendFile(path.join(buildPath, 'index.html'))
})

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`)
})

