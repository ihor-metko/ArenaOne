# Pre-Sales Documentation - Quick Reference Card

## 📚 Overview
**Base URL**: `/docs/pre-sales`  
**Total Pages**: 22 | **Roles**: 6 | **Languages**: EN/UA

---

## 🎯 All Roles and URLs

### 👑 Root Admin (3 pages)
```
/docs/pre-sales/root-admin/overview
/docs/pre-sales/root-admin/create-organization
/docs/pre-sales/root-admin/view-org-admins
```

### 🏢 Organization Owner (3 pages)
```
/docs/pre-sales/org-owner/create-club
/docs/pre-sales/org-owner/add-org-admin
/docs/pre-sales/org-owner/access-control
```

### ⚙️ Organization Admin (3 pages)
```
/docs/pre-sales/org-admin/manage-organization
/docs/pre-sales/org-admin/edit-settings
/docs/pre-sales/org-admin/view-clubs
```

### 🎾 Club Owner (3 pages)
```
/docs/pre-sales/club-owner/crud-courts
/docs/pre-sales/club-owner/working-hours
/docs/pre-sales/club-owner/bookings-overview
```

### 🏟️ Club Admin (4 pages)
```
/docs/pre-sales/club-admin/edit-club
/docs/pre-sales/club-admin/crud-courts
/docs/pre-sales/club-admin/working-hours
/docs/pre-sales/club-admin/bookings-overview
```

### 🎮 Player (4 pages)
```
/docs/pre-sales/player/overview
/docs/pre-sales/player/quick-booking
/docs/pre-sales/player/calendar
/docs/pre-sales/player/confirmation
```

---

## 🧭 Navigation Components

### Sidebar
- **Location**: Left side (always visible)
- **Structure**: 6 collapsible groups (one per role)
- **Component**: `DocsSidebar`
- **File**: `src/app/(pages)/docs/pre-sales/layout.tsx`

### Breadcrumbs
- **Format**: `Docs / Pre-Sales / [Role] / [Page]`
- **Component**: `Breadcrumbs`
- **Separator**: `/`
- **Example**: `Docs / Pre-Sales / Root Admin / Create Organization`

---

## 🌐 Features

### Internationalization (i18n)
✅ **English (EN)** - Default  
✅ **Ukrainian (UA)** - Full support  
📦 **Library**: next-intl  
🔧 **Implementation**: Server-side translations

### Dark Theme
✅ **Supported** via CSS variables  
🎨 **Classes**: `im-*` semantic classes  
📄 **File**: `layout.css`

### Reusable Components
Used from `@/components/ui/docs`:
- `DocsPage` - Page wrapper
- `DocsSection` - Section container
- `DocsRoleGrid` - Role selection grid
- `DocsSidebar` - Sidebar navigation
- `Breadcrumbs` - Breadcrumb navigation
- `DocsCallout` - Highlights
- `DocsSteps` - Step-by-step guides
- `DocsCTA` - Call-to-action links

---

## 📊 Role-Based Flows

### Root Admin Flow
```
Overview → Create Organization → View Org Admins
```
**Purpose**: Platform management

### Org Owner Flow
```
Create Club → Add Org Admin → Access Control
```
**Purpose**: Organization setup

### Org Admin Flow
```
Manage Organization → Edit Settings → View Clubs
```
**Purpose**: Daily management

### Club Owner Flow
```
CRUD Courts → Working Hours → Bookings Overview
```
**Purpose**: Club setup and monitoring

### Club Admin Flow
```
Edit Club → CRUD Courts → Working Hours → Bookings Overview
```
**Purpose**: Club operations

### Player Flow
```
Overview → Quick Booking → Calendar → Confirmation
```
**Purpose**: Booking and scheduling

---

## 🎨 Color Conventions

| Role | Color | Hex Code |
|------|-------|----------|
| Root Admin | 🟣 Purple | #4a1d96 |
| Org Owner | 🔵 Blue | #1e40af |
| Org Admin | 🟦 Teal | #0f766e |
| Club Owner | 🔴 Red | #b91c1c |
| Club Admin | 🟠 Orange | #c2410c |
| Player | 🔷 Cyan | #0e7490 |

---

## 📁 File Structure

```
src/app/(pages)/docs/pre-sales/
├── layout.tsx              # Layout with sidebar & breadcrumbs
├── layout.css              # Custom styles
├── page.tsx                # Index/role selection
├── root-admin/             # 3 pages
├── org-owner/              # 3 pages
├── org-admin/              # 3 pages
├── club-owner/             # 3 pages
├── club-admin/             # 4 pages
└── player/                 # 4 pages
```

---

## 📖 Documentation Files

### Main Navigation Map
**File**: `docs/pre-sales-navigation-map.md`  
**Content**: Complete technical reference with URL mapping, implementation details, and usage guidelines

### Visual Diagrams
**File**: `docs/diagrams/pre-sales-navigation-diagram.md`  
**Content**: 11 Mermaid diagrams showing flows, architecture, and user journeys

### Quick Reference
**File**: `docs/diagrams/quick-reference.md` (this file)  
**Content**: One-page summary for quick lookup

---

## 🚀 Quick Start

### For Developers
1. Navigate to `/docs/pre-sales` to see all roles
2. Click a role to view its pages
3. Use sidebar for quick navigation
4. Follow breadcrumbs to move up hierarchy

### For Client Demos
1. Start at `/docs/pre-sales`
2. Show role selection grid
3. Select relevant role (e.g., Club Owner)
4. Navigate through pages using sidebar
5. Demonstrate i18n by switching language
6. Toggle dark theme to show theme support

### For Documentation
1. Review `pre-sales-navigation-map.md` for details
2. View `pre-sales-navigation-diagram.md` for visuals
3. Check component implementations in `src/components/ui/docs`

---

## ✅ Acceptance Criteria Met

- ✅ All roles and their key steps documented
- ✅ Sidebar and breadcrumbs navigation explained
- ✅ Complete URL mapping for all 22 pages
- ✅ Clear enough for planning and client demos
- ✅ EN/UA i18n support marked and documented
- ✅ Dark theme and Docs UI components highlighted

---

## 🔗 Related Files

- Layout: `src/app/(pages)/docs/pre-sales/layout.tsx`
- Components: `src/components/ui/docs/index.ts`
- Translations: `locales/[locale]/docs.json`
- Settings: `.github/copilot-settings.md`

---

## 📞 Support

For questions or updates:
1. Check the main navigation map documentation
2. Review the visual diagrams
3. Examine the actual implementation files
4. Refer to `.github/copilot-settings.md` for project conventions

---

**Last Updated**: 2026-01-04  
**Version**: 1.0  
**Maintained By**: ArenaOne Development Team
