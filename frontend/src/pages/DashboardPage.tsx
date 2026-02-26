import { useEffect, useState, useCallback } from 'react'
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom'
import {
  Box,
  Button,
  Paper,
  Stack,
  Typography,
  Chip,
  Avatar,
  Divider,
  TextField,
  IconButton,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import EditIcon from '@mui/icons-material/Edit'
import ScheduleIcon from '@mui/icons-material/Schedule'
import LogoutIcon from '@mui/icons-material/Logout'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import AddIcon from '@mui/icons-material/Add'
import CategoryIcon from '@mui/icons-material/Category'
import type { PendingChange, Industry } from '../services/cardApi'
import {
  fetchPendingChanges,
  applyPendingChange,
  fetchIndustries,
  createIndustry,
  deleteIndustry,
} from '../services/cardApi'
import { getAuthToken, clearAuthToken } from '../services/auth'
import type { Card } from './CardsListPage'

function getCardFromChange(change: PendingChange): Card | null {
  const c = change.cardId
  if (!c) return null
  if (typeof c === 'object' && '_id' in c) return c as Card
  return null
}

function formatScheduledAt(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const in24 = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const isToday = d.toDateString() === in24.toDateString()
  return isToday
    ? `Today at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    : d.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
}

function isAuthError(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { response?: { status?: number } }).response?.status === 401
}

const DashboardPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [pending, setPending] = useState<PendingChange[]>([])
  const [loading, setLoading] = useState(true)
  const [applyingId, setApplyingId] = useState<string | null>(null)
  const [industries, setIndustries] = useState<Industry[]>([])
  const [newIndustryLabel, setNewIndustryLabel] = useState('')
  const [addingIndustry, setAddingIndustry] = useState(false)
  const [deletingIndustryId, setDeletingIndustryId] = useState<string | null>(null)

  const loadPending = useCallback(() => {
    if (!getAuthToken()) {
      navigate('/aiiventure/login', { state: { from: { pathname: '/aiiventure/dashboard' } }, replace: true })
      return
    }
    setLoading(true)
    fetchPendingChanges()
      .then(setPending)
      .catch((err) => {
        if (isAuthError(err)) {
          clearAuthToken()
          navigate('/aiiventure/login', { state: { from: location }, replace: true })
        } else {
          console.error('Failed to load pending changes', err)
        }
      })
      .finally(() => setLoading(false))
  }, [navigate, location])

  const loadIndustries = useCallback(() => {
    fetchIndustries()
      .then(setIndustries)
      .catch((err) => console.error('Failed to load industries', err))
  }, [])

  useEffect(() => {
    if (!getAuthToken()) {
      navigate('/aiiventure/login', { state: { from: { pathname: '/aiiventure/dashboard' } }, replace: true })
      return
    }
    loadPending()
    loadIndustries()
  }, [navigate, loadPending, loadIndustries])

  const handleApply = async (changeId: string) => {
    setApplyingId(changeId)
    try {
      await applyPendingChange(changeId)
      setPending((prev) => prev.filter((p) => p._id !== changeId))
    } catch (err) {
      if (isAuthError(err)) {
        clearAuthToken()
        navigate('/aiiventure/login', { state: { from: location }, replace: true })
      } else {
        console.error('Failed to apply change', err)
      }
    } finally {
      setApplyingId(null)
    }
  }

  const handleLogout = () => {
    clearAuthToken()
    navigate('/aiiventure/login', { replace: true })
  }

  const handleAddIndustry = async () => {
    const label = newIndustryLabel.trim()
    if (!label) return
    setAddingIndustry(true)
    try {
      const created = await createIndustry({ label })
      setIndustries((prev) => [...prev, created].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)))
      setNewIndustryLabel('')
    } catch (err) {
      console.error('Failed to add industry', err)
    } finally {
      setAddingIndustry(false)
    }
  }

  const handleDeleteIndustry = async (id: string) => {
    setDeletingIndustryId(id)
    try {
      await deleteIndustry(id)
      setIndustries((prev) => prev.filter((i) => i._id !== id))
    } catch (err) {
      console.error('Failed to delete industry', err)
    } finally {
      setDeletingIndustryId(null)
    }
  }

  const pendingDeletes = pending.filter((p) => p.type === 'delete')
  const pendingEdits = pending.filter((p) => p.type === 'edit')

  return (
    <Stack spacing={4} sx={{ maxWidth: 900, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/')}
          sx={{ color: 'text.secondary', fontWeight: 600 }}
        >
          Back to contacts
        </Button>
        <Button
          startIcon={<LogoutIcon />}
          onClick={handleLogout}
          color="inherit"
          sx={{ fontWeight: 600 }}
        >
          Logout
        </Button>
      </Box>

      <Box>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <CategoryIcon color="primary" /> Industry types
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          Industries shown in the Add Card form and on the contacts list. Add new options here; they appear everywhere.
        </Typography>
        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          <TextField
            size="small"
            placeholder="New industry label"
            value={newIndustryLabel}
            onChange={(e) => setNewIndustryLabel(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddIndustry()}
            sx={{ minWidth: 260 }}
          />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddIndustry}
            disabled={!newIndustryLabel.trim() || addingIndustry}
          >
            {addingIndustry ? 'Adding…' : 'Add industry'}
          </Button>
        </Stack>
        <Stack spacing={1}>
          {industries.map((ind) => (
            <Paper
              key={ind._id}
              elevation={0}
              sx={{
                p: 1.5,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <Typography variant="body1" sx={{ flex: 1, fontWeight: 500 }}>
                {ind.label}
              </Typography>
              <IconButton
                size="small"
                color="error"
                aria-label="Delete industry"
                onClick={() => handleDeleteIndustry(ind._id)}
                disabled={deletingIndustryId === ind._id}
              >
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Paper>
          ))}
        </Stack>
      </Box>

      <Divider />

      <Typography variant="h4" sx={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
        Pending changes
      </Typography>
      <Typography color="text.secondary">
        Edits and deletions scheduled to take effect in 24 hours. Until then, current information is still shown on cards.
      </Typography>

      {loading ? (
        <Typography sx={{ py: 4 }}>Loading…</Typography>
      ) : pending.length === 0 ? (
        <Paper elevation={0} sx={{ p: 5, textAlign: 'center', borderRadius: 3, bgcolor: 'grey.50' }}>
          <ScheduleIcon sx={{ fontSize: 56, color: 'text.secondary', mb: 2 }} />
          <Typography color="text.secondary">No pending edits or deletions.</Typography>
        </Paper>
      ) : (
        <Stack spacing={4}>
          {pendingDeletes.length > 0 && (
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <DeleteOutlineIcon color="error" /> Scheduled deletions
              </Typography>
              <Stack spacing={2}>
                {pendingDeletes.map((change) => {
                  const card = getCardFromChange(change)
                  const cardId = typeof change.cardId === 'object' && change.cardId && '_id' in change.cardId
                    ? (change.cardId as Card)._id
                    : String(change.cardId)
                  return (
                    <Paper
                      key={change._id}
                      elevation={0}
                      sx={{
                        p: 2.5,
                        borderRadius: 3,
                        border: '1px solid',
                        borderColor: 'divider',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        flexWrap: 'wrap',
                      }}
                    >
                      <Avatar sx={{ bgcolor: 'error.light', color: 'error.contrastText' }}>
                        {card?.name ? card.name.charAt(0).toUpperCase() : '?'}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="subtitle1" fontWeight={600}>
                          {card?.name || 'Unknown card'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Will be deleted in 24 hours · {formatScheduledAt(change.scheduledAt)}
                        </Typography>
                      </Box>
                      <Chip label="Delete" color="error" size="small" variant="outlined" />
                      <Button
                        component={RouterLink}
                        to={`/cards/${cardId}`}
                        size="small"
                        variant="outlined"
                      >
                        View card
                      </Button>
                      <Button
                        variant="contained"
                        color="error"
                        size="small"
                        startIcon={<CheckCircleIcon />}
                        onClick={() => handleApply(change._id)}
                        disabled={applyingId === change._id}
                      >
                        {applyingId === change._id ? 'Applying…' : 'Apply now'}
                      </Button>
                    </Paper>
                  )
                })}
              </Stack>
            </Box>
          )}

          {pendingEdits.length > 0 && (
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <EditIcon color="primary" /> Scheduled edits
              </Typography>
              <Stack spacing={2}>
                {pendingEdits.map((change) => {
                  const card = getCardFromChange(change)
                  const cardId = typeof change.cardId === 'object' && change.cardId && '_id' in change.cardId
                    ? (change.cardId as Card)._id
                    : String(change.cardId)
                  const payload = change.payload || {}
                  const fields = [
                    payload.name && `Name: ${payload.name}`,
                    payload.company && `Company: ${payload.company}`,
                    payload.phone && `Phone: ${payload.phone}`,
                    payload.email && `Email: ${payload.email}`,
                    payload.address && `Address: ${payload.address}`,
                  ].filter(Boolean)
                  return (
                    <Paper
                      key={change._id}
                      elevation={0}
                      sx={{
                        p: 2.5,
                        borderRadius: 3,
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, flexWrap: 'wrap' }}>
                        <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                          {card?.name ? card.name.charAt(0).toUpperCase() : '?'}
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="subtitle1" fontWeight={600}>
                            {card?.name || 'Unknown card'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            Will be updated in 24 hours · {formatScheduledAt(change.scheduledAt)}
                          </Typography>
                          {fields.length > 0 && (
                            <>
                              <Divider sx={{ my: 1.5 }} />
                              <Typography variant="caption" color="text.secondary" component="div">
                                Updates: {fields.join(' · ')}
                              </Typography>
                            </>
                          )}
                        </Box>
                        <Chip label="Edit" color="primary" size="small" variant="outlined" />
                        <Button
                          component={RouterLink}
                          to={`/cards/${cardId}`}
                          size="small"
                          variant="outlined"
                        >
                          View card
                        </Button>
                        <Button
                          variant="contained"
                          color="primary"
                          size="small"
                          startIcon={<CheckCircleIcon />}
                          onClick={() => handleApply(change._id)}
                          disabled={applyingId === change._id}
                        >
                          {applyingId === change._id ? 'Applying…' : 'Apply now'}
                        </Button>
                      </Box>
                    </Paper>
                  )
                })}
              </Stack>
            </Box>
          )}
        </Stack>
      )}
    </Stack>
  )
}

export default DashboardPage
