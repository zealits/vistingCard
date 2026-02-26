import { useNavigate, useParams } from 'react-router-dom'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Box,
  Button,
  Chip,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate'
import CameraAltIcon from '@mui/icons-material/CameraAlt'
import CameraswitchIcon from '@mui/icons-material/Cameraswitch'
import RotateRightIcon from '@mui/icons-material/RotateRight'
import type { Card as CardType } from './CardsListPage'
import {
  createCard,
  fetchCardById,
  updateCard,
  scheduleEdit,
  uploadCardImage,
  runOcrOnImages,
} from '../services/cardApi'
import { getCroppedBlob } from '../utils/imageCrop'
import { fetchIndustries } from '../services/cardApi'
import { INDUSTRY_OPTIONS } from '../constants/industries'

const CardFormPage = () => {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const [industryOptions, setIndustryOptions] = useState<string[]>([])
  useEffect(() => {
    fetchIndustries()
      .then((list) => setIndustryOptions(list.map((i) => i.label)))
      .catch(() => setIndustryOptions([...INDUSTRY_OPTIONS]))
  }, [])

  const [card, setCard] = useState<Partial<CardType>>({
    name: '',
    company: '',
    industryType: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
    tags: [],
  })
  const [newTag, setNewTag] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [cropDialogOpen, setCropDialogOpen] = useState(false)
  const [cropSide, setCropSide] = useState<'front' | 'back'>('front')
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [crop, setCrop] = useState<Crop | undefined>(undefined)
  const [imageNaturalSize, setImageNaturalSize] = useState<{ width: number; height: number } | null>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [cameraDialogOpen, setCameraDialogOpen] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [cameraFacingMode, setCameraFacingMode] = useState<'user' | 'environment'>('user')
  const [cameraSwitching, setCameraSwitching] = useState(false)
  const [isRotating, setIsRotating] = useState(false)
  const [editSnackOpen, setEditSnackOpen] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    if (!isEdit || !id) return
    fetchCardById(id)
      .then(setCard)
      .catch((err) => {
        console.error('Failed to load card', err)
      })
  }, [id, isEdit])

  const handleChange =
    (field: keyof CardType) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setCard((prev) => ({ ...prev, [field]: e.target.value }))
    }

  const handleIndustryChange = (e: { target: { value: string } }) => {
    setCard((prev) => ({ ...prev, industryType: e.target.value || undefined }))
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

  const handleFileChange = (side: 'front' | 'back') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCropSide(side)
    const reader = new FileReader()
    reader.onload = () => {
      setImageSrc(reader.result as string)
      setCropDialogOpen(true)
      setPendingFile(file)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const startCamera = (side: 'front' | 'back') => {
    setCropSide(side)
    setCameraError(null)
    setCameraFacingMode('user')
    setCameraDialogOpen(true)
  }

  const requestAndAttachStream = useCallback((facing: 'user' | 'environment') => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    const video = videoRef.current
    if (!video) return
    setCameraError(null)
    navigator.mediaDevices
      .getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      })
      .then((stream) => {
        if (!videoRef.current) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => videoRef.current?.play().catch(() => {})
        setCameraSwitching(false)
      })
      .catch((err) => {
        setCameraError(
          err instanceof Error ? err.message : 'Could not access camera. Please allow camera permission.'
        )
        setCameraSwitching(false)
      })
  }, [])

  const setVideoRef = useCallback(
    (el: HTMLVideoElement | null) => {
      ;(videoRef as React.MutableRefObject<HTMLVideoElement | null>).current = el
      if (!el) {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop())
          streamRef.current = null
        }
        return
      }
      if (!cameraDialogOpen || streamRef.current) return
      requestAndAttachStream(cameraFacingMode)
    },
    [cameraDialogOpen, cameraFacingMode, requestAndAttachStream]
  )

  const switchCamera = () => {
    const next = cameraFacingMode === 'user' ? 'environment' : 'user'
    const previous = cameraFacingMode
    setCameraFacingMode(next)
    setCameraSwitching(true)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    const video = videoRef.current
    if (!video) return
    navigator.mediaDevices
      .getUserMedia({
        video: { facingMode: next, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })
      .then((stream) => {
        if (!videoRef.current) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => videoRef.current?.play().catch(() => {})
        setCameraFacingMode(next)
        setCameraSwitching(false)
      })
      .catch(() => {
        setCameraError('Could not switch camera. This device may only have one camera.')
        setCameraFacingMode(previous)
        setCameraSwitching(false)
        requestAndAttachStream(previous)
      })
  }

  useEffect(() => {
    if (!cameraDialogOpen && streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [cameraDialogOpen])

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    setCameraDialogOpen(false)
    setCameraError(null)
    setCameraSwitching(false)
  }

  const handleCapturePhoto = () => {
    const video = videoRef.current
    if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) return
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92)
    canvas.toBlob(
      (blob) => {
        if (!blob) return
        setImageSrc(dataUrl)
        setPendingFile(new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' }))
        setCropDialogOpen(true)
        stopCamera()
      },
      'image/jpeg',
      0.92
    )
  }

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget
    setImageNaturalSize({ width: naturalWidth, height: naturalHeight })
    setCrop(
      centerCrop(
        makeAspectCrop({ unit: '%', width: 90 }, naturalWidth / naturalHeight, naturalWidth, naturalHeight),
        naturalWidth,
        naturalHeight
      )
    )
  }

  const rotateImage = useCallback(() => {
    if (!imageSrc || !imageNaturalSize) return
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const { width, height } = imageNaturalSize
      const canvas = document.createElement('canvas')
      canvas.width = height
      canvas.height = width
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      // 90° clockwise: swap width/height, setTransform then draw
      ctx.setTransform(0, 1, -1, 0, height, 0)
      ctx.drawImage(img, 0, 0)
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92)
      setImageSrc(dataUrl)
      setImageNaturalSize({ width: height, height: width })
      setCrop(undefined)
    }
    img.src = imageSrc
  }, [imageSrc, imageNaturalSize])

  const handleApplyCropAndScan = async () => {
    if (!imageSrc || !crop || !imageNaturalSize) {
      setCropDialogOpen(false)
      return
    }
    const pixelCrop =
      crop.unit === '%'
        ? {
            x: (crop.x / 100) * imageNaturalSize.width,
            y: (crop.y / 100) * imageNaturalSize.height,
            width: (crop.width / 100) * imageNaturalSize.width,
            height: (crop.height / 100) * imageNaturalSize.height,
          }
        : { x: crop.x, y: crop.y, width: crop.width, height: crop.height }
    if (pixelCrop.width < 1 || pixelCrop.height < 1) {
      setCropDialogOpen(false)
      return
    }
    try {
      setIsScanning(true)
      const blob = await getCroppedBlob(imageSrc, pixelCrop)
      const croppedFile = new File([blob], pendingFile?.name || 'card.jpg', {
        type: 'image/jpeg',
      })
      const { imageUrl, publicId } = await uploadCardImage(croppedFile)
      setCard((prev) => {
        const next = { ...prev }
        if (cropSide === 'front') {
          next.imageUrl = imageUrl
          next.cloudinaryPublicId = publicId
        } else {
          next.imageUrlBack = imageUrl
          next.cloudinaryPublicIdBack = publicId
        }
        return next
      })
      const urls = cropSide === 'front'
        ? [imageUrl, card.imageUrlBack].filter(Boolean) as string[]
        : [card.imageUrl, imageUrl].filter(Boolean) as string[]
      const ocrData = await runOcrOnImages(urls)
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

  const handleRotateDisplayImage = useCallback((side: 'front' | 'back') => {
    const url = side === 'front' ? card.imageUrl : card.imageUrlBack
    if (!url) return
    setIsRotating(true)
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const { width, height } = img
      const canvas = document.createElement('canvas')
      canvas.width = height
      canvas.height = width
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        setIsRotating(false)
        return
      }
      ctx.setTransform(0, 1, -1, 0, height, 0)
      ctx.drawImage(img, 0, 0)
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            setIsRotating(false)
            return
          }
          const file = new File([blob], 'card.jpg', { type: 'image/jpeg' })
          uploadCardImage(file)
            .then(({ imageUrl, publicId }) => {
              setCard((prev) => {
                const next = { ...prev }
                if (side === 'front') {
                  next.imageUrl = imageUrl
                  next.cloudinaryPublicId = publicId
                } else {
                  next.imageUrlBack = imageUrl
                  next.cloudinaryPublicIdBack = publicId
                }
                return next
              })
            })
            .catch((err) => console.error('Failed to rotate/upload image', err))
            .finally(() => setIsRotating(false))
        },
        'image/jpeg',
        0.92
      )
    }
    img.onerror = () => {
      console.error('Failed to load image for rotation')
      setIsRotating(false)
    }
    img.src = url
  }, [card.imageUrl, card.imageUrlBack])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!card.name) return
    setEditError(null)
    try {
      setIsSaving(true)
      if (isEdit && id) {
        await scheduleEdit(id, card)
        setEditSnackOpen(true)
        setTimeout(() => {
          navigate(`/cards/${id}`)
        }, 1500)
      } else {
        await createCard(card)
        navigate('/')
      }
    } catch (err) {
      console.error('Failed to save card', err)
      if (isEdit) setEditError('Failed to schedule update. Please try again.')
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
        <DialogTitle>
          Crop card image ({cropSide === 'front' ? 'front' : 'back'})
        </DialogTitle>
        <DialogContent
          sx={{
            position: 'relative',
            width: '100%',
            height: 400,
            bgcolor: 'grey.900',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {imageSrc && (
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              aspect={undefined}
              style={{ maxHeight: 360 }}
            >
              <img
                src={imageSrc}
                alt="Card to crop"
                onLoad={onImageLoad}
                style={{ maxHeight: 360, width: 'auto', height: 'auto' }}
              />
            </ReactCrop>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, flexWrap: 'wrap', gap: 1 }}>
          <Button
            variant="outlined"
            onClick={rotateImage}
            disabled={!imageSrc || !imageNaturalSize}
          >
            Rotate 90°
          </Button>
          <Box sx={{ flexGrow: 1 }} />
          <Button onClick={() => setCropDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleApplyCropAndScan}
            disabled={!crop || !imageNaturalSize || isScanning}
          >
            {isScanning ? 'Scanning…' : 'Apply & Scan'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={cameraDialogOpen} onClose={stopCamera} maxWidth="sm" fullWidth>
        <DialogTitle>Take photo</DialogTitle>
        <DialogContent sx={{ position: 'relative', bgcolor: 'black', minHeight: 320 }}>
          <video
            ref={setVideoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: '100%',
              display: 'block',
              maxHeight: 400,
              objectFit: 'contain',
            }}
          />
          {cameraError && (
            <Typography color="error" sx={{ position: 'absolute', bottom: 16, left: 16, right: 16 }}>
              {cameraError}
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, flexWrap: 'wrap', gap: 1 }}>
          <Button onClick={stopCamera}>Cancel</Button>
          <Button
            variant="outlined"
            startIcon={<CameraswitchIcon />}
            onClick={switchCamera}
            disabled={cameraSwitching}
          >
            {cameraSwitching ? 'Switching…' : 'Switch camera'}
          </Button>
          <Button
            variant="contained"
            startIcon={<CameraAltIcon />}
            onClick={handleCapturePhoto}
            disabled={cameraSwitching}
          >
            Capture
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={editSnackOpen} autoHideDuration={8000} onClose={() => setEditSnackOpen(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="info" onClose={() => setEditSnackOpen(false)}>
          Your information will be updated in 24 hours. Until then, the current information will be shown.
        </Alert>
      </Snackbar>
      {editError && (
        <Snackbar open={!!editError} autoHideDuration={6000} onClose={() => setEditError(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
          <Alert severity="error" onClose={() => setEditError(null)}>{editError}</Alert>
        </Snackbar>
      )}

      <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 1000, mx: 'auto' }}>
        <Paper elevation={0} sx={{ p: { xs: 3, md: 5 }, borderRadius: 4 }}>
          <Stack spacing={4}>
            <Typography variant="h4" sx={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
              {isEdit ? 'Edit Card' : 'Add New Card'}
            </Typography>

            <Grid container spacing={5}>
              <Grid size={{ xs: 12, md: 5 }}>
                <Stack spacing={3}>
                  <Stack spacing={1.5}>
                    <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
                      Front of card
                    </Typography>
                    <Box
                      sx={{
                        border: '2px dashed',
                        borderColor: 'divider',
                        borderRadius: 0,
                        p: 3,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: 'grey.50',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        minHeight: 160,
                        '&:hover': { bgcolor: 'grey.100', borderColor: 'primary.main' },
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      {!card.imageUrl ? (
                        <>
                          <AddPhotoAlternateIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                            Browse or take photo
                          </Typography>
                          <Stack direction="row" spacing={1}>
                            <Button variant="outlined" size="small" component="label" startIcon={<AddPhotoAlternateIcon />}>
                              Browse
                              <input type="file" hidden accept="image/*" onChange={handleFileChange('front')} />
                            </Button>
                            <Button variant="outlined" size="small" startIcon={<CameraAltIcon />} onClick={() => startCamera('front')}>
                              Take photo
                            </Button>
                          </Stack>
                        </>
                      ) : (
                        <Box component="img" src={card.imageUrl} alt="Front" sx={{ width: '100%', borderRadius: 0, objectFit: 'cover', display: 'block' }} />
                      )}
                    </Box>
                    {card.imageUrl && (
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        <Button variant="outlined" size="small" startIcon={<RotateRightIcon />} onClick={() => handleRotateDisplayImage('front')} disabled={isRotating}>
                          {isRotating ? 'Rotating…' : 'Rotate 90°'}
                        </Button>
                        <Button variant="outlined" size="small" component="label">Replace (file)<input type="file" hidden accept="image/*" onChange={handleFileChange('front')} /></Button>
                        <Button variant="outlined" size="small" startIcon={<CameraAltIcon />} onClick={() => startCamera('front')}>Replace (camera)</Button>
                      </Stack>
                    )}
                  </Stack>

                  <Stack spacing={1.5}>
                    <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
                      Back of card
                    </Typography>
                    <Box
                      sx={{
                        border: '2px dashed',
                        borderColor: 'divider',
                        borderRadius: 0,
                        p: 3,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: 'grey.50',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        minHeight: 160,
                        '&:hover': { bgcolor: 'grey.100', borderColor: 'primary.main' },
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      {!card.imageUrlBack ? (
                        <>
                          <AddPhotoAlternateIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                            Browse or take photo (optional)
                          </Typography>
                          <Stack direction="row" spacing={1}>
                            <Button variant="outlined" size="small" component="label" startIcon={<AddPhotoAlternateIcon />}>
                              Browse
                              <input type="file" hidden accept="image/*" onChange={handleFileChange('back')} />
                            </Button>
                            <Button variant="outlined" size="small" startIcon={<CameraAltIcon />} onClick={() => startCamera('back')}>
                              Take photo
                            </Button>
                          </Stack>
                        </>
                      ) : (
                        <Box component="img" src={card.imageUrlBack} alt="Back" sx={{ width: '100%', borderRadius: 0, objectFit: 'cover', display: 'block' }} />
                      )}
                    </Box>
                    {card.imageUrlBack && (
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        <Button variant="outlined" size="small" startIcon={<RotateRightIcon />} onClick={() => handleRotateDisplayImage('back')} disabled={isRotating}>
                          {isRotating ? 'Rotating…' : 'Rotate 90°'}
                        </Button>
                        <Button variant="outlined" size="small" component="label">Replace (file)<input type="file" hidden accept="image/*" onChange={handleFileChange('back')} /></Button>
                        <Button variant="outlined" size="small" startIcon={<CameraAltIcon />} onClick={() => startCamera('back')}>Replace (camera)</Button>
                      </Stack>
                    )}
                  </Stack>

                  {(card.imageUrl || card.imageUrlBack) && (
                    <Typography variant="caption" color="text.secondary">
                      After adding front (and optionally back), crop each image and use Apply &amp; Scan. OCR runs on all uploaded sides.
                    </Typography>
                  )}
                </Stack>
              </Grid>

              <Grid size={{ xs: 12, md: 7 }}>
                <Stack spacing={3}>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        required
                        fullWidth
                        label="Name"
                        value={card.name || ''}
                        onChange={handleChange('name')}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label="Company"
                        value={card.company || ''}
                        onChange={handleChange('company')}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <FormControl fullWidth>
                        <InputLabel id="industry-type-label">Industry type</InputLabel>
                        <Select
                          labelId="industry-type-label"
                          id="industry-type"
                          value={card.industryType || ''}
                          label="Industry type"
                          onChange={handleIndustryChange}
                        >
                          <MenuItem value="">
                            <em>None</em>
                          </MenuItem>
                          {(industryOptions.length ? industryOptions : [...INDUSTRY_OPTIONS]).map((opt) => (
                            <MenuItem key={opt} value={opt}>
                              {opt}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label="Phone"
                        value={card.phone || ''}
                        onChange={handleChange('phone')}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label="Email"
                        value={card.email || ''}
                        onChange={handleChange('email')}
                      />
                    </Grid>
                    <Grid size={12}>
                      <TextField
                        fullWidth
                        label="Address"
                        value={card.address || ''}
                        onChange={handleChange('address')}
                        placeholder="Street, city, or full address"
                      />
                    </Grid>
                    <Grid size={12}>
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

