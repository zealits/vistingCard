import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material'
import './index.css'
import App from './App.tsx'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#3B82F6', // Blue
      light: '#60A5FA',
      dark: '#2563EB',
    },
    secondary: {
      main: '#14B8A6', // Teal
    },
    background: {
      default: '#F8FAFC',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#0F172A',
      secondary: '#475569',
    },
    divider: '#E2E8F0',
  },
  shape: {
    borderRadius: 14,
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h5: {
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    h6: {
      fontWeight: 600,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: '8px 20px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 4px 12px rgba(59, 130, 246, 0.15)',
          },
        },
        contained: {
          '&:active': {
            boxShadow: 'none',
          },
        },
        outlinedPrimary: {
          borderWidth: '1.5px',
          '&:hover': {
            borderWidth: '1.5px',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        elevation1: {
          boxShadow: '0px 2px 4px rgba(15, 23, 42, 0.04), 0px 1px 2px rgba(15, 23, 42, 0.02)',
          border: '1px solid #E2E8F0',
        },
        elevation2: {
          boxShadow: '0px 8px 16px -4px rgba(15, 23, 42, 0.06), 0px 4px 6px -2px rgba(15, 23, 42, 0.03)',
          border: '1px solid #E2E8F0',
        },
      },
      defaultProps: {
        elevation: 1,
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            backgroundColor: '#F8FAFC',
            transition: 'background-color 0.2s',
            '&:hover': {
              backgroundColor: '#F1F5F9',
            },
            '&.Mui-focused': {
              backgroundColor: '#FFFFFF',
            },
          },
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: '#E2E8F0',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#CBD5E1',
          },
        },
      },
      defaultProps: {
        variant: 'outlined',
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
        },
        filled: {
          backgroundColor: '#F1F5F9',
          color: '#334155',
          border: '1px solid #E2E8F0',
          '&:hover': {
            backgroundColor: '#E2E8F0',
          },
        },
        colorPrimary: {
          backgroundColor: '#EFF6FF',
          color: '#2563EB',
          border: '1px solid #BFDBFE',
          '&:hover': {
            backgroundColor: '#DBEAFE',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
          color: '#0F172A',
          boxShadow: '0px 1px 2px rgba(15, 23, 42, 0.04)',
        },
      },
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>,
)
