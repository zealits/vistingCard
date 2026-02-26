import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Box, Button, Chip, Stack, Typography, Paper } from '@mui/material'
import type { Card as CardType } from './CardsListPage'
import { deleteCard, fetchCardById } from '../services/cardApi'

const CardDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [card, setCard] = useState<CardType | null>(null)

  useEffect(() => {
    if (!id) return
    fetchCardById(id)
      .then(setCard)
      .catch((err) => console.error('Failed to load card', err))
  }, [id])

  const handleDelete = async () => {
    if (!id) return
    try {
      await deleteCard(id)
      navigate('/')
    } catch (err) {
      console.error('Failed to delete card', err)
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
    return <Typography>Loading…</Typography>
  }

  return (
    <Stack spacing={3} sx={{ maxWidth: 1100, mx: 'auto' }}>
      <Paper
        sx={{
          p: 3,
          borderRadius: 3,
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: 3,
          bgcolor: 'background.paper',
        }}
        elevation={2}
      >
        {card.imageUrl && (
          <Box
            component="img"
            src={card.imageUrl}
            alt={card.name}
            sx={{ maxWidth: 360, borderRadius: 3, boxShadow: 3 }}
          />
        )}
        <Stack spacing={1.5} flex={1}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            {card.name}
          </Typography>
          {card.company && (
            <Typography variant="h6" color="text.secondary">
              {card.company}
            </Typography>
          )}
          {card.phone && (
            <Typography variant="body1" color="text.secondary">
              Phone: {card.phone}
            </Typography>
          )}
          {card.email && (
            <Typography variant="body1" color="text.secondary">
              Email: {card.email}
            </Typography>
          )}
          {card.notes && (
            <Box
              sx={{
                mt: 2,
                p: 2,
                borderRadius: 2,
                bgcolor: 'grey.50',
                maxHeight: 220,
                overflow: 'auto',
              }}
            >
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Full text from card
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                {card.notes}
              </Typography>
            </Box>
          )}
          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
            {(card.tags || []).map((tag) => (
              <Chip key={tag} label={tag} sx={{ mb: 1 }} />
            ))}
          </Stack>
        </Stack>
      </Paper>

      <Stack direction="row" spacing={2}>
        <Button variant="contained" onClick={() => navigate(`/cards/${id}/edit`)}>
          Edit
        </Button>
        <Button variant="outlined" color="error" onClick={handleDelete}>
          Delete
        </Button>
        <Button variant="text" onClick={handleCopyLink}>
          Copy card link
        </Button>
        <Button variant="text" onClick={() => navigate('/')}>
          Back to list
        </Button>
      </Stack>
    </Stack>
  )
}

export default CardDetailPage

