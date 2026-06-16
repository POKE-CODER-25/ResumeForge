import {
  ArrowRight,
  Award,
  BadgeCheck,
  Braces,
  Check,
  ChevronRight,
  CircleGauge,
  ClipboardCheck,
  Compass,
  Download,
  FileText,
  Laptop,
  Lightbulb,
  Menu,
  Monitor,
  MousePointer2,
  Pencil,
  Plus,
  Ruler,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  UploadCloud,
  X,
} from 'lucide-react'

const icons = {
  arrowRight: ArrowRight,
  award: Award,
  check: Check,
  chevronRight: ChevronRight,
  clipboard: ClipboardCheck,
  close: X,
  code: Braces,
  compass: Compass,
  computer: Monitor,
  document: FileText,
  download: Download,
  edit: Pencil,
  file: FileText,
  fileText: FileText,
  keyboard: ClipboardCheck,
  laptop: Laptop,
  lightbulb: Lightbulb,
  menu: Menu,
  mouse: MousePointer2,
  plus: Plus,
  ruler: Ruler,
  search: Search,
  shield: ShieldCheck,
  sparkle: Sparkles,
  target: Target,
  trend: TrendingUp,
  upload: UploadCloud,
  quality: BadgeCheck,
  gauge: CircleGauge,
}

function Icon({ name, size = 20, className = '' }) {
  const Component = icons[name] ?? FileText
  return (
    <Component
      className={className}
      size={size}
      strokeWidth={1.9}
      aria-hidden="true"
    />
  )
}

export default Icon
