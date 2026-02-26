import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Box, Button, Chip, Stack, Typography, Paper, Divider, Avatar, Snackbar, Alert, Dialog, DialogContent, IconButton } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import EditIcon from '@mui/icons-material/Edit'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import LinkIcon from '@mui/icons-material/Link'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import BusinessIcon from '@mui/icons-material/Business'
import PhoneIcon from '@mui/icons-material/Phone'
import EmailIcon from '@mui/icons-material/Email'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import type { Card as CardType } from './CardsListPage'
import { fetchCardById, scheduleDelete } from '../services/cardApi'

const CardDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [card, setCard] = useState<CardType | null>(null)
  const [deleteSnackOpen, setDeleteSnackOpen] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    fetchCardById(id)
      .then(setCard)
      .catch((err) => console.error('Failed to load card', err))
  }, [id])

  const handleDelete = async () => {
    if (!id) return
    setDeleteError(null)
    try {
      await scheduleDelete(id)
      setDeleteSnackOpen(true)
    } catch (err) {
      console.error('Failed to schedule delete', err)
      setDeleteError('Failed to schedule deletion. Please try again.')
    }
  }

  const handleCopyLink = async () => {
    if (!id) return
    const url = `${window.location.origin}/cards/${id}`
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      // ignore
    }
  }

  if (!card) {
    return <Typography sx={{ m: 4 }}>Loading…</Typography>
  }

  return (
    <Stack spacing={4} sx={{ maxWidth: 900, mx: 'auto' }}>
      <Box>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/')}
          sx={{ color: 'text.secondary', fontWeight: 600 }}
        >
          Back to list
        </Button>
      </Box>

      <Paper
        sx={{
          p: { xs: 3, md: 5 },
          borderRadius: 4,
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: 5,
          bgcolor: 'background.paper',
        }}
        elevation={0}
      >
        <Box sx={{ flex: '0 0 auto', width: { xs: '100%', md: 340 } }}>
          <Stack spacing={2}>
            {card.imageUrl ? (
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                  Front
                </Typography>
                <Box
                  component="img"
                  src={card.imageUrl}
                  alt={`${card.name} – front`}
                  sx={{ width: '100%', borderRadius: 0, display: 'block', border: '1px solid', borderColor: 'divider', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}
                />
              </Box>
            ) : (
              <Box sx={{ width: '100%', pt: '66%', bgcolor: 'grey.50', borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed', borderColor: 'divider', position: 'relative' }}>
                <Avatar sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 80, height: 80, bgcolor: 'primary.light', fontSize: '2.5rem' }}>
                  {card.name ? card.name.charAt(0).toUpperCase() : '?'}
                </Avatar>
              </Box>
            )}
            {card.imageUrlBack && (
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                  Back
                </Typography>
                <Box
                  component="img"
                  src={card.imageUrlBack}
                  alt={`${card.name} – back`}
                  sx={{ width: '100%', borderRadius: 0, display: 'block', border: '1px solid', borderColor: 'divider', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}
                />
              </Box>
            )}
          </Stack>
        </Box>

        <Stack spacing={3} flex={1}>
          <Box>
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 1, letterSpacing: '-0.02em' }}>
              {card.name}
            </Typography>
            {card.company && (
              <Typography variant="h6" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <BusinessIcon />
                {card.company}
              </Typography>
            )}
          </Box>

          <Divider />

          <Stack spacing={2.5}>
            {card.phone && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'secondary.light', color: 'secondary.contrastText', width: 44, height: 44 }}>
                  <PhoneIcon />
                </Avatar>
                <Typography variant="body1" sx={{ fontWeight: 500, fontSize: '1.1rem' }}>
                  {card.phone}
                </Typography>
              </Box>
            )}
            {card.email && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.contrastText', width: 44, height: 44 }}>
                  <EmailIcon />
                </Avatar>
                <Typography variant="body1" sx={{ fontWeight: 500, fontSize: '1.1rem' }}>
                  {card.email}
                </Typography>
              </Box>
            )}
            {card.address && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'success.light', color: 'success.contrastText', width: 44, height: 44 }}>
                  <LocationOnIcon />
                </Avatar>
                <Typography variant="body1" sx={{ fontWeight: 500, fontSize: '1.1rem' }}>
                  {card.address}
                </Typography>
              </Box>
            )}
          </Stack>

          {card.notes && (
            <Box
              sx={{
                mt: 1,
                p: 3,
                borderRadius: 3,
                bgcolor: 'grey.50',
                border: '1px solid',
                borderColor: 'divider'
              }}
            >
              <Typography variant="subtitle2" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1.5, fontWeight: 700 }}>
                Notes / OCR Text
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', color: 'text.primary', fontFamily: 'monospace', lineHeight: 1.6 }}>
                {card.notes}
              </Typography>
            </Box>
          )}

          {card.tags && card.tags.length > 0 && (
            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
              {card.tags.map((tag) => (
                <Chip key={tag} label={tag} sx={{ mb: 1, fontWeight: 600 }} color="primary" variant="outlined" />
              ))}
            </Stack>
          )}

          <Stack direction="row" spacing={2} sx={{ pt: 3, mt: 'auto', borderTop: '1px solid', borderColor: 'divider' }}>
            <Button variant="contained" startIcon={<EditIcon />} onClick={() => navigate(`/cards/${id}/edit`)}>
              Edit Info
            </Button>
            <Button variant="outlined" color="inherit" startIcon={<LinkIcon />} onClick={handleCopyLink}>
              Copy Link
            </Button>
            <Box sx={{ flexGrow: 1 }} />
            <Button variant="text" color="error" startIcon={<DeleteOutlineIcon />} onClick={handleDelete}>
              Delete
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Dialog
        open={deleteSnackOpen}
        onClose={() => {}}
        disableEscapeKeyDown
        hideBackdrop={false}
        PaperProps={{
          sx: {
            borderRadius: 2,
            minWidth: 320,
            maxWidth: 420,
          },
        }}
        sx={{
          '& .MuiDialog-container': {
            alignItems: 'center',
            justifyContent: 'center',
          },
        }}
      >
        <DialogContent sx={{ pt: 3, pb: 2, px: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            <Alert severity="info" icon={false} sx={{ flex: 1, py: 0, '& .MuiAlert-message': { py: 0.5 } }}>
              Your card will be deleted in 24 hours.
            </Alert>
            <IconButton
              aria-label="Close"
              onClick={() => setDeleteSnackOpen(false)}
              sx={{ mt: -0.5, mr: -0.5 }}
              size="small"
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogContent>
      </Dialog>
      {deleteError && (
        <Snackbar open={!!deleteError} autoHideDuration={6000} onClose={() => setDeleteError(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
          <Alert severity="error" onClose={() => setDeleteError(null)}>{deleteError}</Alert>
        </Snackbar>
      )}
    </Stack>
  )
}

export default CardDetailPage

