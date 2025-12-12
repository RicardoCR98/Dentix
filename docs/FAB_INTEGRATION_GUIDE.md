# FAB Integration Guide - Quick Start

This is a condensed guide for integrating the Floating Action Button into your pages. For full design specifications, see [FAB_DESIGN_SPECIFICATION.md](./FAB_DESIGN_SPECIFICATION.md).

---

## Quick Integration (5 Steps)

### Step 1: Import Dependencies

```typescript
import { FloatingActionButton } from "../components/FloatingActionButton";
import { useScrollVisibility } from "../hooks/useScrollVisibility";
import { useRef } from "react";
```

### Step 2: Create Ref & Hook

```typescript
export function YourComponent() {
  // Create ref for the section you want to track
  const quickActionsRef = useRef<HTMLElement>(null);

  // Hook determines when FAB should be visible
  const showFAB = useScrollVisibility({ targetRef: quickActionsRef });

  // ... rest of your component
}
```

### Step 3: Attach Ref to Section

Find your "Acciones Rápidas" (Quick Actions) section and add the ref:

```tsx
<Section
  ref={quickActionsRef}  // ← Add this
  title="Acciones Rápidas"
  // ... other props
>
  {/* Your quick action buttons */}
</Section>
```

### Step 4: Add FAB Component

Place this at the end of your component's JSX (before the closing fragment):

```tsx
<FloatingActionButton
  visible={showFAB}
  onNewRecord={handleNew}
  onPrint={handlePrint}
  onSearch={() => setSearchDialogOpen(true)}
  onPendingPayments={() => setPaymentsDialogOpen(true)}
/>
```

### Step 5: Ensure Section Supports Refs

Make sure your `Section` component uses `forwardRef`:

```typescript
// src/components/Section.tsx
import { forwardRef } from 'react';

const Section = forwardRef<HTMLElement, SectionProps>(
  ({ title, icon, right, children, className }, ref) => {
    return (
      <section ref={ref} className={cn('mb-8', className)}>
        {/* ... section content */}
      </section>
    );
  }
);

Section.displayName = 'Section';
export default Section;
```

---

## Complete Example

```typescript
// YourPage.tsx
import { useRef } from "react";
import { FloatingActionButton } from "../components/FloatingActionButton";
import { useScrollVisibility } from "../hooks/useScrollVisibility";
import Section from "../components/Section";

export function YourPage() {
  // 1. Create ref and visibility hook
  const quickActionsRef = useRef<HTMLElement>(null);
  const showFAB = useScrollVisibility({ targetRef: quickActionsRef });

  // 2. Your action handlers
  const handleNew = () => {
    // Create new record
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSearch = () => {
    setSearchDialogOpen(true);
  };

  const handlePayments = () => {
    setPaymentsDialogOpen(true);
  };

  return (
    <>
      {/* 3. Attach ref to Quick Actions section */}
      <Section ref={quickActionsRef} title="Acciones Rápidas">
        {/* Your quick action buttons */}
      </Section>

      {/* Other sections */}
      <Section title="Patient Data">
        {/* ... */}
      </Section>

      {/* 4. Add FAB at the end */}
      <FloatingActionButton
        visible={showFAB}
        onNewRecord={handleNew}
        onPrint={handlePrint}
        onSearch={handleSearch}
        onPendingPayments={handlePayments}
      />
    </>
  );
}
```

---

## Alternative: Scroll Threshold

If you don't have a specific section to track, use scroll position threshold:

```typescript
// Show FAB after scrolling 300px
const showFAB = useScrollVisibility({ threshold: 300 });

// No need for ref!
```

---

## Props Reference

### FloatingActionButton

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `visible` | `boolean` | Yes | Controls FAB visibility (from hook) |
| `onNewRecord` | `() => void` | Yes | Handler for "Nueva historia" action |
| `onPrint` | `() => void` | Yes | Handler for "Imprimir" action |
| `onSearch` | `() => void` | Yes | Handler for "Búsqueda de pacientes" |
| `onPendingPayments` | `() => void` | Yes | Handler for "Cartera de pendientes" |

### useScrollVisibility Hook

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `targetRef` | `RefObject<HTMLElement>` | - | Element to observe (preferred) |
| `threshold` | `number` | `200` | Scroll pixels before showing (if no ref) |
| `rootMargin` | `string` | `"0px"` | IntersectionObserver margin |

**Returns:** `boolean` - `true` when FAB should be visible

---

## Behavior

### When FAB Appears
- User scrolls past the "Acciones Rápidas" section
- Section is no longer visible in viewport
- FAB fades in smoothly from bottom-right

### When FAB Disappears
- User scrolls back to top
- "Acciones Rápidas" section becomes visible
- FAB fades out smoothly

### Menu Interactions
- **Click FAB**: Opens speed dial menu (4 actions)
- **Click backdrop**: Closes menu
- **Click action**: Executes action and closes menu
- **Press Escape**: Closes menu
- **Tab navigation**: Works with keyboard
- **Hover action**: Shows label tooltip

---

## Customization

### Changing Position

Edit `FloatingActionButton.tsx`:

```typescript
// Change from bottom-right to bottom-left
className="fixed bottom-6 left-6 z-50"  // instead of right-6
```

### Changing Colors

Colors are theme-aware via CSS variables. To customize:

```typescript
// In src/index.css
:root {
  --success: 142 71% 45%;  /* Nueva historia - green */
  --info: 199 89% 48%;     /* Imprimir - blue */
  --purple: 264 100% 60%;  /* Búsqueda - purple */
  --danger: 0 84% 60%;     /* Cartera - red */
}
```

### Changing Icon Size

Edit `FloatingActionButton.tsx`:

```tsx
// Main FAB icon
<Plus size={32} />  // Default is 28

// Action icons
icon: <Plus size={28} />  // Default is 24
```

---

## Troubleshooting

### FAB Not Showing

1. **Check visibility prop**
   ```typescript
   console.log('showFAB:', showFAB);  // Should toggle on scroll
   ```

2. **Verify ref is attached**
   ```typescript
   console.log('ref:', quickActionsRef.current);  // Should not be null
   ```

3. **Check Section forwardRef**
   - Ensure `Section` component accepts and uses `ref`

### Menu Not Opening

1. **Check state in DevTools**
   - `isExpanded` should toggle on click

2. **Check z-index**
   - Ensure no elements have z-index > 50

### Animations Not Smooth

1. **Check CSS animations are defined**
   - Verify `animate-fadeIn`, `animate-scaleIn` exist in `index.css`

2. **Reduce motion preference**
   - Some users have animations disabled OS-wide

---

## Accessibility Checklist

- [ ] All buttons have descriptive `aria-label`
- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Focus visible on all interactive elements
- [ ] Screen reader announces menu state
- [ ] Color contrast meets WCAG AA (4.5:1)
- [ ] Touch targets are minimum 48px

---

## Performance Tips

1. **Use IntersectionObserver** (targetRef) instead of scroll threshold
2. **Avoid re-renders** - handlers should be memoized with `useCallback`
3. **Lazy load** - Only render FAB when needed
4. **GPU acceleration** - Already optimized with CSS transforms

---

## Testing

### Manual Testing

1. Scroll down until "Acciones Rápidas" disappears → FAB appears
2. Scroll back to top → FAB disappears
3. Click FAB → Menu opens with 4 buttons
4. Hover each button → Label appears
5. Click action → Dialog/function executes, menu closes
6. Click backdrop → Menu closes
7. Press Tab → Focus moves through FAB and menu items
8. Press Escape → Menu closes

### Automated Testing (Future)

```typescript
describe('FloatingActionButton', () => {
  it('shows when visible prop is true', () => {
    render(<FloatingActionButton visible={true} {...handlers} />);
    expect(screen.getByRole('group')).toBeVisible();
  });

  it('hides when visible prop is false', () => {
    render(<FloatingActionButton visible={false} {...handlers} />);
    expect(screen.getByRole('group')).toHaveClass('opacity-0');
  });

  it('opens menu on click', () => {
    render(<FloatingActionButton visible={true} {...handlers} />);
    fireEvent.click(screen.getByLabelText(/abrir menú/i));
    expect(screen.getByRole('menu')).toBeVisible();
  });
});
```

---

## Support

- **Full Specification**: [FAB_DESIGN_SPECIFICATION.md](./FAB_DESIGN_SPECIFICATION.md)
- **Component Source**: `src/components/FloatingActionButton.tsx`
- **Hook Source**: `src/hooks/useScrollVisibility.ts`
- **Example Integration**: `src/pages/PatientsPageUnified.tsx`

---

## Quick Command Reference

```bash
# View FAB component
code src/components/FloatingActionButton.tsx

# View scroll hook
code src/hooks/useScrollVisibility.ts

# View integration example
code src/pages/PatientsPageUnified.tsx

# View Section component (for ref support)
code src/components/Section.tsx
```

---

That's it! You should now have a fully functional FAB in your application. If you encounter issues, refer to the troubleshooting section or the full design specification.
