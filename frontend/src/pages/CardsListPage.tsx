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
import { Link as RouterLink } from 'react-router-dom'
import { fetchCards } from '../services/cardApi'

export interface Card {
  _id: string
  name: string
  company?: string
  phone?: string
  email?: string
  tags?: string[]
  imageUrl?: string
  notes?: string
  createdAt?: string
}

function filterCards(cards: Card[], query: string, activeTag: string | null) {
  const q = query.toLowerCase().trim()
  return cards.filter((card) => {
    if (activeTag && !(card.tags || []).includes(activeTag)) return false
    if (!q) return true
    const haystack = [
      card.name,
      card.company,
      card.phone,
      card.email,
      ...(card.tags || []),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    return haystack.includes(q)
  })
}

const CardsListPage = () => {
  const [cards, setCards] = useState<Card[]>([])
  const [search, setSearch] = useState('')
  const [activeTag, setActiveTag] = useState<string | null>(null)

  useEffect(() => {
    fetchCards()
      .then(setCards)
      .catch((err) => {
        console.error('Failed to load cards', err)
      })
  }, [])

  const allTags = Array.from(
    new Set(cards.flatMap((c) => c.tags || [])),
  ).sort((a, b) => a.localeCompare(b))

  const visibleCards = filterCards(cards, search, activeTag)

  return (
    <Stack spacing={3}>
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          borderRadius: 3,
          bgcolor: 'background.paper',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: 2,
          alignItems: { xs: 'flex-start', md: 'center' },
        }}
      >
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Business Cards
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Store, search and organize all visiting cards in one place.
          </Typography>
        </Box>
        <Button
          variant="contained"
          component={RouterLink}
          to="/cards/new"
          sx={{ borderRadius: 999, px: 3 }}
        >
          Add Card
        </Button>
      </Paper>

      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderRadius: 3,
          bgcolor: 'background.paper',
        }}
      >
        <Stack spacing={1.5}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search by name, company, phone, email or tag"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {allTags.length > 0 && (
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {allTags.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  clickable
                  color={activeTag === tag ? 'primary' : 'default'}
                  onClick={() => setActiveTag((prev) => (prev === tag ? null : tag))}
                  sx={{ mb: 1 }}
                  size="small"
                />
              ))}
            </Stack>
          )}
        </Stack>
      </Paper>

      <Grid container spacing={3}>
        {visibleCards.map((card) => (
          <Grid item xs={12} sm={6} md={4} key={card._id}>
            <Paper
              component={RouterLink}
              to={`/cards/${card._id}`}
              elevation={2}
              sx={{
                p: 2,
                display: 'block',
                textDecoration: 'none',
                borderRadius: 3,
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                '&:hover': {
                  transform: 'translateY(-3px)',
                  boxShadow: 6,
                },
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {card.name}
              </Typography>
              {card.company && (
                <Typography variant="body2" color="text.secondary">
                  {card.company}
                </Typography>
              )}
              <Box sx={{ mt: 1 }}>
                {card.phone && (
                  <Typography variant="body2" color="text.secondary">
                    {card.phone}
                  </Typography>
                )}
                {card.email && (
                  <Typography variant="body2" color="text.secondary">
                    {card.email}
                  </Typography>
                )}
              </Box>
              <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap' }}>
                {(card.tags || []).slice(0, 3).map((tag) => (
                  <Chip key={tag} label={tag} size="small" />
                ))}
                {(card.tags || []).length > 3 && (
                  <Chip
                    label={`+${(card.tags || []).length - 3}`}
                    size="small"
                    variant="outlined"
                  />
                )}
              </Stack>
            </Paper>
          </Grid>
        ))}
        {visibleCards.length === 0 && (
          <Grid item xs={12}>
            <Typography color="text.secondary">
              No cards found. Try adjusting your search or add a new card.
            </Typography>
          </Grid>
        )}
      </Grid>
    </Stack>
  )
}

export default CardsListPage

