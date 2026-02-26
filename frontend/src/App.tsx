import { AppBar, Box, Container, Toolbar } from '@mui/material'
import { Route, Routes } from 'react-router-dom'
import CardsListPage from './pages/CardsListPage'
import logo from './assets/giftygen_logo.png'
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
          <a
            href="https://giftygen.com/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}
          >
            <img
              src={logo}
              alt="giftygen"
              style={{ height: 80, width: 'auto', display: 'block' }}
            />
          </a>
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
