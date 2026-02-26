import { useEffect, useState } from 'react'
import {
  Avatar,
  Box,
  Button,
  Chip,
  Grid,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import SearchIcon from '@mui/icons-material/Search'
import AddIcon from '@mui/icons-material/Add'
import BusinessIcon from '@mui/icons-material/Business'
import PhoneIcon from '@mui/icons-material/Phone'
import EmailIcon from '@mui/icons-material/Email'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import { fetchCards } from '../services/cardApi'

export interface Card {
  _id: string
  name: string
  company?: string
  phone?: string
  email?: string
  address?: string
  tags?: string[]
  imageUrl?: string
  imageUrlBack?: string
  notes?: string
  cloudinaryPublicId?: string
  cloudinaryPublicIdBack?: string
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
      card.address,
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
    <Stack spacing={4}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 4 },
          borderRadius: 4,
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: 3,
          alignItems: { xs: 'flex-start', md: 'center' },
          backgroundImage: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
          boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.3)',
        }}
      >
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, letterSpacing: '-0.02em' }}>
            Your Contacts
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9, fontSize: '1.1rem' }}>
            Store, search and organize all visiting cards in one place.
          </Typography>
        </Box>
        <Button
          variant="contained"
          component={RouterLink}
          to="/cards/new"
          startIcon={<AddIcon />}
          sx={{
            py: 1.2,
            px: 3,
            bgcolor: 'white',
            color: 'primary.dark',
            fontWeight: 700,
            '&:hover': {
              bgcolor: 'grey.100',
              transform: 'translateY(-1px)',
            },
            transition: 'all 0.2s',
          }}
        >
          Add Card
        </Button>
      </Paper>

      <Box>
        <Stack spacing={2}>
          <TextField
            fullWidth
            placeholder="Search by name, company, phone, email, address or tag"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
              sx: { bgcolor: 'background.paper', borderRadius: 3 }
            }}
          />

          {allTags.length > 0 && (
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ rowGap: 1 }}>
              {allTags.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  clickable
                  color={activeTag === tag ? 'primary' : 'default'}
                  onClick={() => setActiveTag((prev) => (prev === tag ? null : tag))}
                  sx={{
                    fontWeight: activeTag === tag ? 600 : 500,
                    transition: 'all 0.2s'
                  }}
                />
              ))}
            </Stack>
          )}
        </Stack>
      </Box>

      <Grid container spacing={3}>
        {visibleCards.map((card) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={card._id}>
            <Paper
              component={RouterLink}
              to={`/cards/${card._id}`}
              elevation={1}
              sx={{
                p: 3,
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                textDecoration: 'none',
                color: 'inherit',
                borderRadius: 4,
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0px 12px 20px -8px rgba(15, 23, 42, 0.1)',
                  borderColor: 'primary.light',
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2.5, gap: 2 }}>
                <Avatar
                  sx={{
                    width: 52,
                    height: 52,
                    bgcolor: 'primary.light',
                    color: 'primary.contrastText',
                    fontWeight: 600,
                    fontSize: '1.25rem'
                  }}
                >
                  {card.name ? card.name.charAt(0).toUpperCase() : '?'}
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }} noWrap>
                    {card.name}
                  </Typography>
                  {card.company && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, display: 'flex', alignItems: 'center', gap: 0.5 }} noWrap>
                      <BusinessIcon sx={{ fontSize: 16 }} />
                      {card.company}
                    </Typography>
                  )}
                </Box>
              </Box>

              <Box sx={{ mb: 2.5, flexGrow: 1 }}>
                <Stack spacing={1}>
                  {card.phone && (
                    <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <PhoneIcon sx={{ fontSize: 18, color: 'text.secondary', opacity: 0.7 }} />
                      {card.phone}
                    </Typography>
                  )}
                  {card.email && (
                    <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <EmailIcon sx={{ fontSize: 18, color: 'text.secondary', opacity: 0.7 }} />
                      {card.email}
                    </Typography>
                  )}
                  {card.address && (
                    <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <LocationOnIcon sx={{ fontSize: 18, color: 'text.secondary', opacity: 0.7 }} />
                      {card.address}
                    </Typography>
                  )}
                </Stack>
              </Box>

              {card.tags && card.tags.length > 0 && (
                <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', rowGap: 1, mt: 'auto', pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                  {card.tags.slice(0, 3).map((tag) => (
                    <Chip key={tag} label={tag} size="small" variant="filled" sx={{ bgcolor: 'grey.100' }} />
                  ))}
                  {card.tags.length > 3 && (
                    <Chip
                      label={`+${card.tags.length - 3}`}
                      size="small"
                      variant="outlined"
                    />
                  )}
                </Stack>
              )}
            </Paper>
          </Grid>
        ))}
        {visibleCards.length === 0 && (
          <Grid size={12}>
            <Box sx={{ textAlign: 'center', py: 8, px: 2, bgcolor: 'background.paper', borderRadius: 4, border: '1px dashed', borderColor: 'divider' }}>
              <Typography variant="h6" color="text.primary" sx={{ mb: 1 }}>
                No cards found
              </Typography>
              <Typography color="text.secondary">
                Try adjusting your search or add a new visiting card to your vault.
              </Typography>
            </Box>
          </Grid>
        )}
      </Grid>
    </Stack>
  )
}

export default CardsListPage

