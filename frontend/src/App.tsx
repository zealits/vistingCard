import { AppBar, Box, Container, IconButton, Toolbar, Typography } from '@mui/material'
import { Route, Routes, Link as RouterLink } from 'react-router-dom'
import MenuIcon from '@mui/icons-material/Menu'
import CardsListPage from './pages/CardsListPage'
import CardFormPage from './pages/CardFormPage'
import CardDetailPage from './pages/CardDetailPage'

function App() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar
        position="sticky"
        elevation={2}
        color="primary"
        sx={{
          borderBottomLeftRadius: 24,
          borderBottomRightRadius: 24,
        }}
      >
        <Toolbar sx={{ maxWidth: 1120, mx: 'auto', width: '100%' }}>
          <IconButton
            edge="start"
            color="inherit"
            sx={{
              mr: 2,
              display: { xs: 'inline-flex', md: 'none' },
            }}
          >
            <MenuIcon />
          </IconButton>
          <Typography
            variant="h6"
            component={RouterLink}
            to="/"
            sx={{
              textDecoration: 'none',
              color: 'inherit',
              fontWeight: 700,
              letterSpacing: 0.4,
            }}
          >
            Visiting Card Vault
          </Typography>
        </Toolbar>
      </AppBar>
      <Container
        sx={{
          py: 4,
          maxWidth: 1120,
          mx: 'auto',
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
