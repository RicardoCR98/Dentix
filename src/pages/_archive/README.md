# Archived Components

This directory contains deprecated patient page components that have been replaced by the unified component architecture.

## Archived Files

### PatientsPage.tsx (874 lines)
**Archived Date:** 2025-12-11
**Reason:** Replaced by `PatientsPageUnified.tsx`
**Original Purpose:** Vertical layout for patient records

**Issues:**
- Duplicate code (419 lines shared with PatientsPageTabbed.tsx)
- State loss when switching layouts
- No data loss prevention
- Hard to maintain alongside PatientsPageTabbed.tsx

### PatientsPageTabbed.tsx (1,007 lines)
**Archived Date:** 2025-12-11
**Reason:** Replaced by `PatientsPageUnified.tsx`
**Original Purpose:** Tabbed layout for patient records

**Issues:**
- Duplicate code (419 lines shared with PatientsPage.tsx)
- State loss when switching layouts
- No data loss prevention
- Hard to maintain alongside PatientsPage.tsx

## Replacement

Both components have been replaced by:
- **`PatientsPageUnified.tsx`** (705 lines) - Single component with conditional rendering

## Migration Details

**Phase:** Zustand Migration Phase 3
**Date:** 2025-12-11
**Documentation:** See `/docs/PHASE_3_COMPLETE.md`

### Key Improvements

1. ✅ **State Preservation** - No data loss when switching layouts
2. ✅ **Data Loss Prevention** - Browser warns before losing unsaved work
3. ✅ **Code Reduction** - 62.5% less code (1,881 → 705 lines)
4. ✅ **Unified Logic** - Single source of truth via custom hooks
5. ✅ **Database Persistence** - Layout preference saved to `user_settings`

### Custom Hooks Created

The duplicate logic from these components was extracted into reusable hooks:
- `usePatientRecord` - Patient data and operations (344 lines)
- `usePatientFromURL` - URL parameter handling (75 lines)
- `useMasterData` - Reference data management (128 lines)

## Restoration

If you need to restore these components:

1. Copy files back to `/src/pages/`
2. Update `PatientsPageWrapper.tsx` to conditionally render them
3. Remove Zustand store imports from `ThemePanel.tsx`

**Note:** This is not recommended as it reintroduces the state loss bug.

## Safe to Delete?

**Yes**, these files can be safely deleted after 30 days if no issues are found with the unified component.

**Before deleting:**
- Verify unified component works in production
- Test all user workflows (create, edit, search, save)
- Test layout switching preserves state
- Test data loss prevention warnings
- Test database persistence of layout preference

## References

- Implementation Plan: `/docs/STATE_MANAGEMENT_IMPLEMENTATION_PLAN.md`
- Phase 3 Report: `/docs/PHASE_3_COMPLETE.md`
- Custom Hooks Guide: `/docs/CUSTOM_HOOKS_GUIDE.md`
- Store Architecture: `/docs/STATE_MANAGEMENT_ARCHITECTURE.md`

---

**Archived by:** Claude Code (Sonnet 4.5)
**Project:** Dentix - Dental Clinic Management System
