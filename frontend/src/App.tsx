import { AppBar, Box, Container, Toolbar, Button } from '@mui/material'
import { Route, Routes, Link as RouterLink } from 'react-router-dom'
import CardsListPage from './pages/CardsListPage'
import logo from './assets/giftygen_logo.png'
import CardFormPage from './pages/CardFormPage'
import CardDetailPage from './pages/CardDetailPage'
import DashboardPage from './pages/DashboardPage'
import DashboardLoginPage from './pages/DashboardLoginPage'

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
        <Toolbar sx={{ maxWidth: 1200, mx: 'auto', width: '100%', px: { xs: 2, sm: 3 }, justifyContent: 'space-between' }}>
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
          <Button component={RouterLink} to="/aiiventure/dashboard" color="inherit" sx={{ fontWeight: 600 }}>
            Dashboard
          </Button>
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
          <Route path="/aiiventure/login" element={<DashboardLoginPage />} />
          <Route path="/aiiventure/dashboard" element={<DashboardPage />} />
        </Routes>
      </Container>
    </Box>
  )
}

export default App
