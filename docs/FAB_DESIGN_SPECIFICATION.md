# Floating Action Button (FAB) Design Specification

## Overview

This document describes the design, implementation, and usage of the Floating Action Button (FAB) system for the Dentix dental clinic management application.

## Design Philosophy

The FAB provides quick access to frequently-used actions when the user has scrolled past the "Acciones Rápidas" section, improving efficiency without cluttering the interface.

### Key Design Principles

1. **Progressive Disclosure**: FAB only appears when primary actions are off-screen
2. **Spatial Consistency**: Fixed bottom-right position (industry standard)
3. **Speed Dial Pattern**: Single main button expands to reveal 4 actions
4. **Contextual Awareness**: Visibility controlled by scroll position
5. **Accessible by Default**: Full keyboard navigation and screen reader support

---

## Visual Design

### Main FAB Button

**Specifications:**
- **Size**: 56px × 56px (optimal touch target)
- **Shape**: Perfect circle
- **Position**: `bottom: 24px, right: 24px` (fixed)
- **Z-index**: 50 (above content, below modals/dialogs)
- **Background**: `hsl(var(--brand))` - Brand color
- **Shadow**: Elevated with `--shadow-lg`
- **Icon**: Plus (+) that rotates 45° when expanded (becomes ×)

**Visual States:**
- **Default**: Brand color, subtle shadow
- **Hover**: Scale 1.05, shadow intensifies
- **Active**: Scale 0.95 (pressed effect)
- **Focus**: Ring outline for keyboard navigation

### Speed Dial Menu

**Layout:**
- 4 action buttons stacked vertically above main FAB
- **Spacing**: 16px gap between each button
- **Direction**: Bottom-to-top (industry standard)
- **Backdrop**: Semi-transparent overlay (20% black with 2px blur)

**Action Buttons:**

1. **Nueva historia** (New Record)
   - Color: `hsl(var(--success))` - Green
   - Icon: Plus
   - Position: Topmost

2. **Imprimir** (Print)
   - Color: `hsl(var(--info))` - Blue
   - Icon: Printer
   - Position: Second

3. **Búsqueda de pacientes** (Search Patients)
   - Color: `hsl(var(--purple))` - Purple
   - Icon: Search
   - Position: Third

4. **Cartera de pendientes** (Pending Payments)
   - Color: `hsl(var(--danger))` - Red
   - Icon: Wallet
   - Position: Fourth (closest to main FAB)

**Button Specifications:**
- **Size**: 48px × 48px
- **Shape**: Circle
- **Text Label**: Appears on hover (left side)
- **Label Style**: White background, rounded, shadow-lg
- **Icon Size**: 24px

---

## Animation Specifications

### FAB Visibility

**Trigger**: Scroll position (IntersectionObserver on "Acciones Rápidas")

```css
Transition:
  Duration: 200ms
  Easing: ease-out
  Properties: opacity, transform (scale + translateY)

Hidden State:
  opacity: 0
  scale: 0.9
  translateY: 16px
  pointer-events: none

Visible State:
  opacity: 1
  scale: 1
  translateY: 0
  pointer-events: auto
```

### Icon Rotation

**Trigger**: Click/tap on main FAB

```css
Transition:
  Duration: 250ms
  Easing: cubic-bezier(0.4, 0.0, 0.2, 1)

Collapsed: rotate(0deg)
Expanded: rotate(45deg)
```

### Speed Dial Expansion

**Trigger**: Main FAB click

```css
Menu Container:
  Duration: 300ms
  Easing: cubic-bezier(0.16, 1, 0.3, 1) /* Spring-like */

Individual Items (Staggered):
  Duration: 120ms per item
  Stagger Delay: 60ms
  Animation: scaleIn (scale 0 → 1, opacity 0 → 1)
  Fill Mode: backwards

Order: Bottom to top (item 4 → item 1)
```

### Label Tooltip

**Trigger**: Hover over action button

```css
Transition:
  Duration: 150ms
  Easing: ease-out

Hidden:
  opacity: 0
  scale: 0.95
  translateX: 8px

Visible:
  opacity: 1
  scale: 1
  translateX: 0
```

### Backdrop Overlay

**Trigger**: Menu expansion

```css
Animation: fadeIn
Duration: 200ms
Background: rgba(0, 0, 0, 0.2)
Backdrop-filter: blur(2px)
```

---

## Interaction Behavior

### Opening Menu

1. User clicks main FAB
2. Icon rotates 45° (becomes ×)
3. Backdrop overlay fades in
4. Menu items scale in with stagger (bottom-to-top)
5. Focus remains on main FAB

### Closing Menu

**Triggers:**
- Click main FAB again
- Click backdrop overlay
- Press Escape key
- Click any action button (execute action + close)
- Click outside FAB area

**Animation:**
- Items fade out (no stagger)
- Icon rotates back to + (0°)
- Backdrop fades out

### Executing Actions

1. User clicks action button OR presses Enter/Space when focused
2. Action executes (e.g., open dialog, print, new record)
3. Menu automatically closes
4. Focus returns to main FAB

---

## Accessibility

### Keyboard Navigation

**Tab Order:**
1. Main FAB (always accessible)
2. Action items (only when menu expanded)

**Key Bindings:**
- **Tab**: Move focus between FAB and menu items
- **Enter / Space**: Activate focused button
- **Escape**: Close menu (when expanded)

### ARIA Labels

**Main FAB:**
```html
aria-label: "Abrir menú de acciones rápidas" (collapsed)
aria-label: "Cerrar menú de acciones rápidas" (expanded)
aria-expanded: true/false
aria-haspopup: "menu"
```

**Menu Container:**
```html
role: "menu"
aria-hidden: true/false
```

**Action Buttons:**
```html
role: "menuitem"
aria-label: Descriptive action name
tabIndex: 0 (when expanded), -1 (when collapsed)
```

### Screen Reader Support

- State changes announced ("expanded", "collapsed")
- Each action has clear descriptive label
- Focus management prevents keyboard traps
- Visual focus indicators for all interactive elements

### Color Contrast

All color combinations meet **WCAG AA** standards:
- White text on brand blue: 4.5:1
- White text on success green: 4.5:1
- White text on info blue: 4.5:1
- White text on purple: 4.5:1
- White text on danger red: 4.5:1

### Touch Targets

Minimum 48px × 48px for all interactive elements (exceeds WCAG AAA requirement of 44px).

---

## Scroll Detection

### Implementation Strategy

**IntersectionObserver API** (preferred for performance):

```typescript
const quickActionsRef = useRef<HTMLElement>(null);
const showFAB = useScrollVisibility({ targetRef: quickActionsRef });
```

**How It Works:**
1. Observer monitors "Acciones Rápidas" section
2. When section scrolls out of viewport → `isHidden = true`
3. When section scrolls back into viewport → `isHidden = false`
4. FAB visibility tied to `isHidden` state

**Benefits:**
- More performant than scroll listeners
- No manual threshold calculations
- Automatic cleanup on unmount
- Supports both vertical and tabbed layouts

**Fallback** (if ref not provided):
- Uses scroll position threshold (default: 200px)
- `showFAB = scrollY > threshold`

---

## Technical Implementation

### Component Structure

```
FloatingActionButton/
├── Main FAB Button
│   └── Plus Icon (rotates on expand)
├── Speed Dial Menu (conditional)
│   ├── Action Button 1 (Nueva historia)
│   ├── Action Button 2 (Imprimir)
│   ├── Action Button 3 (Búsqueda)
│   └── Action Button 4 (Cartera)
└── Backdrop Overlay (conditional)
```

### Props Interface

```typescript
interface FloatingActionButtonProps {
  visible: boolean;              // Controlled visibility
  onNewRecord: () => void;       // Nueva historia handler
  onPrint: () => void;           // Print handler
  onSearch: () => void;          // Search dialog handler
  onPendingPayments: () => void; // Pending payments handler
}
```

### State Management

```typescript
const [isExpanded, setIsExpanded] = useState(false);
```

**Local state only** - no global state needed.

### Event Handlers

1. **Click Outside**: Close menu when clicking backdrop or outside area
2. **Escape Key**: Close menu
3. **Action Click**: Execute callback + close menu
4. **Toggle**: Click main FAB to open/close

---

## Integration Guide

### 1. Import Components

```typescript
import { FloatingActionButton } from "../components/FloatingActionButton";
import { useScrollVisibility } from "../hooks/useScrollVisibility";
```

### 2. Create Ref for Quick Actions Section

```typescript
const quickActionsRef = useRef<HTMLElement>(null);
```

### 3. Add Scroll Visibility Hook

```typescript
const showFAB = useScrollVisibility({ targetRef: quickActionsRef });
```

### 4. Attach Ref to Quick Actions Section

```tsx
<Section
  ref={quickActionsRef}
  title="Acciones Rápidas"
  // ... other props
>
  {/* Quick action buttons */}
</Section>
```

### 5. Add FAB Component

```tsx
<FloatingActionButton
  visible={showFAB}
  onNewRecord={handleNew}
  onPrint={handlePrint}
  onSearch={() => setSearchDialogOpen(true)}
  onPendingPayments={() => setPaymentsDialogOpen(true)}
/>
```

### 6. Update Section Component (if needed)

Ensure `Section` component supports `forwardRef`:

```typescript
const Section = forwardRef<HTMLElement, SectionProps>(
  ({ title, icon, right, children, className }, ref) => {
    return (
      <section ref={ref} className={cn('mb-8', className)}>
        {/* ... */}
      </section>
    );
  }
);
```

---

## File Locations

```
src/
├── components/
│   ├── FloatingActionButton.tsx    # Main FAB component
│   └── Section.tsx                 # Updated with forwardRef
├── hooks/
│   └── useScrollVisibility.ts      # Scroll detection hook
└── pages/
    └── PatientsPageUnified.tsx     # Integration example
```

---

## Theme Integration

### CSS Variables Used

```css
--brand          /* Main FAB color */
--success        /* Nueva historia (green) */
--info           /* Imprimir (blue) */
--purple         /* Búsqueda (purple) */
--danger         /* Cartera (red) */
--surface        /* Label background */
--foreground     /* Label text */
--border         /* Label border */
--shadow-lg      /* Elevated shadows */
```

### Dark Mode Support

All colors automatically adapt to dark mode via CSS variables. No additional work required.

### Custom Animations

Uses existing animation classes from `src/index.css`:
- `animate-fadeIn`
- `animate-scaleIn`

---

## Performance Considerations

### Optimizations

1. **IntersectionObserver**: More efficient than scroll listeners
2. **RAF Throttling**: Scroll events use `requestAnimationFrame`
3. **Conditional Rendering**: Menu only rendered when expanded
4. **CSS Transforms**: GPU-accelerated animations (scale, rotate, translate)
5. **Will-change**: Applied to animated elements
6. **Passive Listeners**: Scroll events marked as passive

### Bundle Size

- FloatingActionButton: ~2KB (minified)
- useScrollVisibility: ~0.5KB (minified)
- Total: **~2.5KB** additional bundle size

---

## Browser Support

- Chrome/Edge 88+
- Firefox 55+
- Safari 12.1+
- IntersectionObserver: All modern browsers
- Fallback: Scroll position detection for older browsers

---

## Testing Checklist

### Visual Testing

- [ ] FAB appears when scrolling past "Acciones Rápidas"
- [ ] FAB hides when scrolling back to top
- [ ] Icon rotates smoothly on expand/collapse
- [ ] Menu items animate in with stagger
- [ ] Backdrop overlay appears and is semi-transparent
- [ ] Labels appear on hover
- [ ] All buttons use correct colors
- [ ] Dark mode renders correctly

### Interaction Testing

- [ ] Click main FAB opens menu
- [ ] Click main FAB again closes menu
- [ ] Click backdrop closes menu
- [ ] Escape key closes menu
- [ ] Click action executes and closes menu
- [ ] Click outside closes menu
- [ ] Hover shows labels

### Accessibility Testing

- [ ] Tab navigation works
- [ ] Enter/Space activates buttons
- [ ] ARIA labels present
- [ ] Screen reader announces state changes
- [ ] Focus visible on all elements
- [ ] Color contrast meets WCAG AA
- [ ] Touch targets are 48px minimum

### Responsive Testing

- [ ] Works on mobile (portrait)
- [ ] Works on mobile (landscape)
- [ ] Works on tablet
- [ ] Works on desktop
- [ ] Doesn't overlap content at different screen sizes

---

## Future Enhancements

### Potential Improvements

1. **Haptic Feedback**: Vibration on mobile devices when opening menu
2. **Customizable Position**: Allow left/right positioning
3. **More Actions**: Support 5-6 actions with scroll
4. **Quick Action Shortcuts**: Show keyboard shortcuts in labels
5. **Animation Preferences**: Respect `prefers-reduced-motion`
6. **Context-Aware Actions**: Different actions based on current tab
7. **Drag to Reorder**: Allow users to customize action order

### Configuration Options

Future props to consider:

```typescript
interface FloatingActionButtonProps {
  // ... existing props
  position?: 'bottom-right' | 'bottom-left';
  size?: 'sm' | 'md' | 'lg';
  actions?: FABAction[];  // Custom action configuration
  maxVisibleActions?: number;
  theme?: 'auto' | 'light' | 'dark';
}
```

---

## Troubleshooting

### FAB Not Appearing

**Check:**
1. Is `quickActionsRef` attached to Section?
2. Is Section component using `forwardRef`?
3. Is `visible` prop set correctly?
4. Check z-index conflicts

### Animations Stuttering

**Solutions:**
1. Ensure GPU acceleration (use `transform` not `top/left`)
2. Check for layout thrashing
3. Verify `will-change` is applied
4. Reduce animation complexity

### Accessibility Issues

**Common Fixes:**
1. Verify all ARIA labels are present
2. Check `tabIndex` is correct
3. Test with screen reader
4. Ensure focus management works

---

## Credits

**Design Pattern**: Material Design Speed Dial
**Implementation**: Custom React component
**Icons**: Lucide React
**Animations**: Custom CSS animations + Tailwind
**Accessibility**: WCAG 2.1 Level AA compliant

---

## Changelog

### v1.0.0 (2025-12-12)
- Initial implementation
- 4 quick actions (New, Print, Search, Payments)
- IntersectionObserver-based scroll detection
- Full keyboard navigation and screen reader support
- Dark mode support
- Staggered animations
- Label tooltips on hover

---

## Contact

For questions or suggestions about the FAB design system, please refer to the main project documentation or open an issue in the project repository.
