import { CalendarDays, LayoutDashboard, ListChecks, Settings, UserCircle, Users, type LucideIcon } from "lucide-react";

export interface AdvisorNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** False while the page does not exist yet. The item is shown disabled rather than linking to a dead end. */
  ready: boolean;
}

export const ADVISOR_HOME = "/advisor";

export const ADVISOR_NAV: AdvisorNavItem[] = [
  { label: "Overview", href: ADVISOR_HOME, icon: LayoutDashboard, ready: true },
  { label: "My Customers", href: "/advisor/customers", icon: Users, ready: true },
  { label: "Appointments", href: "/advisor/appointments", icon: CalendarDays, ready: true },
  { label: "Follow-ups", href: "/advisor/follow-ups", icon: ListChecks, ready: true },
  { label: "My Profile", href: "/advisor/profile", icon: UserCircle, ready: true },
  { label: "Settings", href: "/advisor/settings", icon: Settings, ready: true },
];

/** Overview matches only itself; every other item also owns its sub-pages (/advisor/customers/CUS-1). */
export function isActive(href: string, pathname: string): boolean {
  if (href === ADVISOR_HOME) return pathname === ADVISOR_HOME;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export interface Crumb {
  label: string;
  href: string;
}

export function breadcrumbsFor(pathname: string): Crumb[] {
  const root: Crumb = { label: "Advisor", href: ADVISOR_HOME };
  const section = ADVISOR_NAV.find((item) => item.href !== ADVISOR_HOME && isActive(item.href, pathname));
  if (!section) return [root, { label: "Overview", href: ADVISOR_HOME }];
  const crumbs = [root, { label: section.label, href: section.href }];
  // A page below a section (one customer, one quote) gets a last, unlinked crumb
  return pathname === section.href ? crumbs : [...crumbs, { label: "Details", href: pathname }];
}
