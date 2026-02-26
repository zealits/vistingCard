import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing'
import ApartmentIcon from '@mui/icons-material/Apartment'
import ComputerIcon from '@mui/icons-material/Computer'
import AgricultureIcon from '@mui/icons-material/Agriculture'
import CheckroomIcon from '@mui/icons-material/Checkroom'
import AccountBalanceIcon from '@mui/icons-material/AccountBalance'
import HotelIcon from '@mui/icons-material/Hotel'
import LocalHospitalIcon from '@mui/icons-material/LocalHospital'
import ImportExportIcon from '@mui/icons-material/ImportExport'
import type { SvgIconComponent } from '@mui/icons-material'

export const INDUSTRY_OPTIONS = [
  'Manufacturing & Industrial',
  'Real Estate & Construction',
  'IT & Technology',
  'FMCG & Agro-tech',
  'Lifestyle & Consumer Goods',
  'Services & Finance',
  'Hospitality & Tourism',
  'Health & Wellness',
  'Import-Export',
] as const

export type IndustryLabel = (typeof INDUSTRY_OPTIONS)[number]

const PILL_COLORS: Record<string, string> = {
  'Manufacturing & Industrial': '#F97316',      // orange
  'Real Estate & Construction': '#0D9488',     // teal
  'IT & Technology': '#3B82F6',                 // blue
  'FMCG & Agro-tech': '#22C55E',                // green
  'Lifestyle & Consumer Goods': '#A855F7',      // purple
  'Services & Finance': '#6366F1',              // indigo
  'Hospitality & Tourism': '#EC4899',           // pink
  'Health & Wellness': '#EF4444',               // red
  'Import-Export': '#EAB308',                   // yellow/amber
}

const PILL_ICONS: Record<string, SvgIconComponent> = {
  'Manufacturing & Industrial': PrecisionManufacturingIcon,
  'Real Estate & Construction': ApartmentIcon,
  'IT & Technology': ComputerIcon,
  'FMCG & Agro-tech': AgricultureIcon,
  'Lifestyle & Consumer Goods': CheckroomIcon,
  'Services & Finance': AccountBalanceIcon,
  'Hospitality & Tourism': HotelIcon,
  'Health & Wellness': LocalHospitalIcon,
  'Import-Export': ImportExportIcon,
}

export function getIndustryIcon(label: string): SvgIconComponent | undefined {
  return PILL_ICONS[label]
}

export function getIndustryColor(label: string): string {
  return PILL_COLORS[label] ?? '#94A3B8'
}
