import { AppBar, Avatar, Box, Container, Toolbar, Typography } from '@mui/material'
import { Route, Routes, Link as RouterLink } from 'react-router-dom'
import ViewCarouselIcon from '@mui/icons-material/ViewCarousel'
import CardsListPage from './pages/CardsListPage'
import CardFormPage from './pages/CardFormPage'
import CardDetailPage from './pages/CardDetailPage'

function App() {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Toolbar sx={{ maxWidth: 1200, mx: 'auto', width: '100%', px: { xs: 2, sm: 3 } }}>
          <Avatar
            variant="rounded"
            sx={{
              mr: 2,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              width: 40,
              height: 40,
            }}
          >
            <ViewCarouselIcon />
          </Avatar>
          <Typography
            variant="h6"
            component={RouterLink}
            to="/"
            sx={{
              textDecoration: 'none',
              color: 'text.primary',
              fontWeight: 700,
              letterSpacing: '-0.01em',
            }}
          >
            Card Vault
          </Typography>
        </Toolbar>
      </AppBar>
      <Container
        component="main"
        sx={{
          py: 5,
          flexGrow: 1,
          maxWidth: '1200px !important',
          px: { xs: 2, sm: 3 },
        }}
      >
        <Routes>
          <Route path="/" element={<CardsListPage />} />
          <Route path="/cards/new" element={<CardFormPage />} />
          <Route path="/cards/:id" element={<CardDetailPage />} />
          <Route path="/cards/:id/edit" element={<CardFormPage />} />
        </Routes>
      </Container>
    </Box>
  )
}

export default App
