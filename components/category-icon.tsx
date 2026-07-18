// Mapa ikon kategorii (nazwy z kolumny categories.icon w Supabase).
// Importujemy wyłącznie używane ikony zamiast całej biblioteki
// (wcześniejsze `import * as LucideIcons` wciągało ~1500 ikon do bundla
// strony głównej i kategorii). Nieznana nazwa -> fallback Tag, czyli
// dokładnie to samo zachowanie co dotychczas.

import {
  Armchair,
  Car,
  CircleDollarSign,
  Coffee,
  Cpu,
  FlaskConical,
  Phone,
  Pill,
  Plug,
  ShieldCheck,
  Shirt,
  ShoppingCart,
  SprayCan,
  Stethoscope,
  Truck,
  Tv,
  Utensils,
  Wrench,
  Zap,
  Tag,
  type LucideIcon,
} from "lucide-react"

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Armchair,
  Car,
  CircleDollarSign,
  Coffee,
  Cpu,
  FlaskConical,
  Phone,
  Pill,
  Plug,
  ShieldCheck,
  Shirt,
  ShoppingCart,
  SprayCan,
  Stethoscope,
  Truck,
  Tv,
  Utensils,
  Wrench,
  Zap,
}

/** Ikona kategorii po nazwie z bazy; nieznana/pusta nazwa -> Tag. */
export function getCategoryIcon(name?: string | null): LucideIcon {
  return (name && CATEGORY_ICONS[name]) || Tag
}
