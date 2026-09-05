"use client";

import {
  Home,
  ShieldAlert,
  Calendar,
  ShieldCheck,
  Radio,
  Activity,
  Bell,
  BookOpen,
  Users,
  MapPin,
  Send,
  Languages,
  FileText,
  Settings,
  Sparkles,
  Search,
  Command,
  Menu,
  X,
  LogOut,
  ChevronRight,
  type LucideProps,
} from "lucide-react";

const ICON_MAP: Record<string, React.ComponentType<LucideProps>> = {
  Home,
  ShieldAlert,
  Calendar,
  ShieldCheck,
  Radio,
  Activity,
  Bell,
  BookOpen,
  Users,
  MapPin,
  Send,
  Languages,
  FileText,
  Settings,
  Sparkles,
  Search,
  Command,
  Menu,
  X,
  LogOut,
  ChevronRight,
};

export function AdminIcon({ name, size = 16, className = "" }: { name: string; size?: number; className?: string }) {
  const IconComponent = ICON_MAP[name] || Sparkles;
  return <IconComponent size={size} className={className} />;
}
