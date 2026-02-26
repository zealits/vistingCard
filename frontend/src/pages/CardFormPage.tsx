import { useNavigate, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import {
  Box,
  Button,
  Chip,
  Grid,
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

      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          maxWidth: 1100,
          mx: 'auto',
        }}
      >
        <Stack spacing={3}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            {isEdit ? 'Edit Card' : 'Add New Card'}
          </Typography>

          <Grid container spacing={3}>
          <Grid item xs={12} md={5}>
            <Stack spacing={2}>
              <Button
                variant="outlined"
                component="label"
                sx={{ borderRadius: 999 }}
                fullWidth
              >
                {isScanning ? 'Scanning…' : 'Upload & Scan Card Image'}
                <input type="file" hidden accept="image/*" onChange={handleFileChange} />
              </Button>
              {card.imageUrl && (
                <Box
                  component="img"
                  src={card.imageUrl}
                  alt="Card"
                  sx={{
                    width: '100%',
                    borderRadius: 3,
                    boxShadow: 3,
                    objectFit: 'cover',
                  }}
                />
              )}
            </Stack>
          </Grid>

          <Grid item xs={12} md={7}>
            <Stack spacing={2.5}>
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

              <Stack spacing={1}>
                <Stack direction="row" spacing={1}>
                  <TextField
                    label="Add tag"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    size="small"
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

          <Stack direction="row" spacing={2} sx={{ pt: 1 }}>
            <Button
              type="submit"
              variant="contained"
              disabled={isSaving || !card.name}
            >
              {isEdit ? 'Save changes' : 'Create card'}
            </Button>
            <Button variant="text" onClick={() => navigate('/')}>
              Cancel
            </Button>
          </Stack>
        </Stack>
      </Box>
    </>
  )
}

export default CardFormPage

