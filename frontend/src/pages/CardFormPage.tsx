import { useNavigate, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import {
  Box,
  Button,
  Chip,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Slider from '@mui/material/Slider'
import Cropper from 'react-easy-crop'
import type { Area } from 'react-easy-crop'
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate'
import type { Card as CardType } from './CardsListPage'
import {
  createCard,
  fetchCardById,
  updateCard,
  uploadCardImage,
  runOcrOnImage,
} from '../services/cardApi'
import { getCroppedBlob } from '../utils/imageCrop'

const CardFormPage = () => {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const [card, setCard] = useState<Partial<CardType>>({
    name: '',
    company: '',
    phone: '',
    email: '',
    notes: '',
    tags: [],
  })
  const [newTag, setNewTag] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [cropDialogOpen, setCropDialogOpen] = useState(false)
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)

  useEffect(() => {
    if (!isEdit || !id) return
    fetchCardById(id)
      .then(setCard)
      .catch((err) => {
        console.error('Failed to load card', err)
      })
  }, [id, isEdit])

  const handleChange =
    (field: keyof CardType) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setCard((prev) => ({ ...prev, [field]: e.target.value }))
    }

  const handleAddTag = () => {
    const trimmed = newTag.trim()
    if (!trimmed) return
    setCard((prev) => ({
      ...prev,
      tags: Array.from(new Set([...(prev.tags || []), trimmed])),
    }))
    setNewTag('')
  }

  const handleRemoveTag = (tag: string) => {
    setCard((prev) => ({
      ...prev,
      tags: (prev.tags || []).filter((t) => t !== tag),
    }))
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setImageSrc(reader.result as string)
      setCropDialogOpen(true)
      setPendingFile(file)
    }
    reader.readAsDataURL(file)
  }

  const onCropComplete = (_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels)
  }

  const handleApplyCropAndScan = async () => {
    if (!imageSrc || !croppedAreaPixels) {
      setCropDialogOpen(false)
      return
    }
    try {
      setIsScanning(true)
      const blob = await getCroppedBlob(imageSrc, croppedAreaPixels)
      const croppedFile = new File([blob], pendingFile?.name || 'card.jpg', {
        type: 'image/jpeg',
      })
      const { imageUrl } = await uploadCardImage(croppedFile)
      setCard((prev) => ({ ...prev, imageUrl }))
      const ocrData = await runOcrOnImage(imageUrl)
      setCard((prev) => ({
        ...prev,
        ...ocrData,
        tags: prev.tags,
      }))
    } catch (err) {
      console.error('Failed to crop/upload/scan image', err)
    } finally {
      setIsScanning(false)
      setCropDialogOpen(false)
      setPendingFile(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!card.name) return
    try {
      setIsSaving(true)
      if (isEdit && id) {
        await updateCard(id, card)
      } else {
        await createCard(card)
      }
      navigate('/')
    } catch (err) {
      console.error('Failed to save card', err)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <Dialog
        open={cropDialogOpen && !!imageSrc}
        onClose={() => setCropDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Crop card image</DialogTitle>
        <DialogContent
          sx={{
            position: 'relative',
            width: '100%',
            height: 400,
            bgcolor: 'black',
          }}
        >
          {imageSrc && (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={3 / 2}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Box sx={{ flexGrow: 1, mr: 3 }}>
            <Slider
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(_, value) => setZoom(value as number)}
            />
          </Box>
          <Button onClick={() => setCropDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleApplyCropAndScan}>
            Apply & Scan
          </Button>
        </DialogActions>
      </Dialog>

      <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 1000, mx: 'auto' }}>
        <Paper elevation={0} sx={{ p: { xs: 3, md: 5 }, borderRadius: 4 }}>
          <Stack spacing={4}>
            <Typography variant="h4" sx={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
              {isEdit ? 'Edit Card' : 'Add New Card'}
            </Typography>

            <Grid container spacing={5}>
              <Grid item xs={12} md={5}>
                <Stack spacing={2}>
                  <Box
                    component="label"
                    sx={{
                      border: '2px dashed',
                      borderColor: 'divider',
                      borderRadius: 4,
                      p: 4,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: 'grey.50',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      minHeight: 240,
                      '&:hover': {
                        bgcolor: 'grey.100',
                        borderColor: 'primary.main',
                      },
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    {!card.imageUrl && (
                      <>
                        <AddPhotoAlternateIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary', mb: 0.5 }}>
                          {isScanning ? 'Scanning…' : 'Upload Card Image'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Click to browse files
                        </Typography>
                      </>
                    )}
                    {card.imageUrl && (
                      <Box
                        component="img"
                        src={card.imageUrl}
                        alt="Card"
                        sx={{
                          width: '100%',
                          borderRadius: 2,
                          objectFit: 'cover',
                          display: 'block'
                        }}
                      />
                    )}
                    <input type="file" hidden accept="image/*" onChange={handleFileChange} />
                  </Box>
                  {card.imageUrl && (
                    <Button variant="outlined" component="label" sx={{ alignSelf: 'center' }}>
                      Replace Image
                      <input type="file" hidden accept="image/*" onChange={handleFileChange} />
                    </Button>
                  )}
                </Stack>
              </Grid>

              <Grid item xs={12} md={7}>
                <Stack spacing={3}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        required
                        fullWidth
                        label="Name"
                        value={card.name || ''}
                        onChange={handleChange('name')}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Company"
                        value={card.company || ''}
                        onChange={handleChange('company')}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Phone"
                        value={card.phone || ''}
                        onChange={handleChange('phone')}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Email"
                        value={card.email || ''}
                        onChange={handleChange('email')}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Notes (full text from card)"
                        multiline
                        minRows={4}
                        value={card.notes || ''}
                        onChange={handleChange('notes')}
                      />
                    </Grid>
                  </Grid>

                  <Stack spacing={1.5}>
                    <Stack direction="row" spacing={1}>
                      <TextField
                        label="Add tag"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        size="small"
                        sx={{ flexGrow: 1 }}
                      />
                      <Button variant="contained" onClick={handleAddTag}>
                        Add
                      </Button>
                    </Stack>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      {(card.tags || []).map((tag) => (
                        <Chip
                          key={tag}
                          label={tag}
                          onDelete={() => handleRemoveTag(tag)}
                          sx={{ mb: 1 }}
                        />
                      ))}
                    </Stack>
                  </Stack>
                </Stack>
              </Grid>
            </Grid>

            <Box sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button variant="text" color="inherit" onClick={() => navigate('/')}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={isSaving || !card.name}
                sx={{ px: 4 }}
              >
                {isSaving ? 'Saving...' : isEdit ? 'Save changes' : 'Create card'}
              </Button>
            </Box>
          </Stack>
        </Paper>
      </Box>
    </>
  )
}

export default CardFormPage

