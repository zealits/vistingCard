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
import CategoryIcon from '@mui/icons-material/Category'
import { fetchCards, fetchIndustries } from '../services/cardApi'
import type { Industry } from '../services/cardApi'
import { INDUSTRY_OPTIONS, getIndustryColor, getIndustryIcon } from '../constants/industries'

export interface Card {
  _id: string
  name: string
  company?: string
  industryType?: string
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

function filterCards(
  cards: Card[],
  query: string,
  activeTag: string | null,
  activeIndustry: string | null
) {
  const q = query.toLowerCase().trim()
  return cards.filter((card) => {
    if (activeTag && !(card.tags || []).includes(activeTag)) return false
    if (activeIndustry && card.industryType !== activeIndustry) return false
    if (!q) return true
    const haystack = [
      card.name,
      card.company,
      card.industryType,
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
  const [industries, setIndustries] = useState<Industry[]>([])
  const [search, setSearch] = useState('')
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [activeIndustry, setActiveIndustry] = useState<string | null>(null)

  useEffect(() => {
    fetchCards()
      .then(setCards)
      .catch((err) => {
        console.error('Failed to load cards', err)
      })
  }, [])

  useEffect(() => {
    fetchIndustries()
      .then(setIndustries)
      .catch(() => setIndustries(INDUSTRY_OPTIONS.map((label, order) => ({ _id: label, label, order }))))
  }, [])

  const allTags = Array.from(
    new Set(cards.flatMap((c) => c.tags || [])),
  ).sort((a, b) => a.localeCompare(b))

  const visibleCards = filterCards(cards, search, activeTag, activeIndustry)

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

          <Box
            sx={{
              overflowX: 'auto',
              pb: 0.5,
              scrollbarWidth: 'thin',
              scrollbarColor: (theme) => `${theme.palette.primary.main} ${theme.palette.grey[200]}`,
              '&::-webkit-scrollbar': { height: 8 },
              '&::-webkit-scrollbar-track': {
                bgcolor: 'grey.200',
                borderRadius: 4,
              },
              '&::-webkit-scrollbar-thumb': {
                bgcolor: 'primary.main',
                borderRadius: 4,
                '&:hover': {
                  bgcolor: 'primary.dark',
                },
              },
            }}
          >
            <Stack
              direction="row"
              spacing={1.5}
              sx={{
                flexWrap: 'nowrap',
                minWidth: 'max-content',
                alignItems: 'center',
              }}
            >
              <Button
                variant={activeIndustry === null ? 'contained' : 'outlined'}
                size="medium"
                onClick={() => setActiveIndustry(null)}
                startIcon={<CategoryIcon />}
                sx={{
                  borderRadius: 10,
                  textTransform: 'none',
                  fontWeight: 600,
                  flexShrink: 0,
                  borderWidth: 1.5,
                  px: 2,
                }}
              >
                All
              </Button>
              {(industries.length ? industries : INDUSTRY_OPTIONS.map((label, i) => ({ _id: label, label, order: i }))).map((ind) => {
                const label = typeof ind === 'string' ? ind : ind.label
                const Icon = getIndustryIcon(label) ?? CategoryIcon
                const color = getIndustryColor(label)
                const selected = activeIndustry === label
                return (
                  <Button
                    key={typeof ind === 'string' ? label : ind._id}
                    variant="outlined"
                    size="medium"
                    onClick={() => setActiveIndustry((prev) => (prev === label ? null : label))}
                    startIcon={
                      <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            bgcolor: selected ? color : `${color}20`,
                            color: selected ? 'white' : color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Icon sx={{ fontSize: 18 }} />
                        </Box>
                    }
                    sx={{
                      borderRadius: 10,
                      textTransform: 'none',
                      fontWeight: selected ? 600 : 500,
                      flexShrink: 0,
                      borderColor: selected ? color : 'divider',
                      borderWidth: selected ? 2 : 1,
                      color: selected ? color : 'text.primary',
                      bgcolor: selected ? `${color}12` : 'background.paper',
                      px: 2,
                      '&:hover': {
                        borderColor: color,
                        bgcolor: `${color}18`,
                      },
                    }}
                  >
                    {label}
                  </Button>
                )
              })}
            </Stack>
          </Box>

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
                  {card.industryType && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25, display: 'block' }} noWrap>
                      {card.industryType}
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
                {activeIndustry ? 'No business cards in this industry' : 'No cards found'}
              </Typography>
              <Typography color="text.secondary">
                {activeIndustry
                  ? `No contacts with industry "${activeIndustry}". Try another industry or clear the filter.`
                  : 'Try adjusting your search or add a new visiting card to your vault.'}
              </Typography>
            </Box>
          </Grid>
        )}
      </Grid>
    </Stack>
  )
}

export default CardsListPage

