# Testing Checklist - Unified Component Migration

This checklist covers all critical workflows to verify the unified component works correctly after the Zustand migration.

**Date:** 2025-12-11
**Phase:** Post Phase 3 - Cleanup & Testing
**Component:** `PatientsPageUnified.tsx`

---

## Pre-Testing Setup

### Environment Setup
- [ ] Application builds without errors (`pnpm run build`)
- [ ] TypeScript compiles without errors (`pnpm exec tsc --noEmit`)
- [ ] Application starts in development mode (`pnpm tauri:dev`)
- [ ] Database is initialized (clinic.db exists)

### Browser Setup
- [ ] Clear localStorage (to test fresh installation)
- [ ] Clear application data (for database reset tests)
- [ ] Open DevTools Console (to monitor errors)
- [ ] Network tab open (to monitor IPC calls)

---

## 1. Basic Functionality Tests

### 1.1 New Patient Record
- [ ] Click "Nueva historia" button
- [ ] Form is empty
- [ ] Date is set to today
- [ ] Odontogram is empty
- [ ] Sessions table is empty
- [ ] Attachments list is empty

### 1.2 Fill Patient Form
- [ ] Enter patient name
- [ ] Enter document ID (cédula)
- [ ] Enter phone number
- [ ] Enter date of birth
- [ ] Enter email
- [ ] Enter emergency phone
- [ ] All fields save correctly

### 1.3 Odontogram Interaction
- [ ] Click a tooth (e.g., tooth 11)
- [ ] Diagnosis dialog opens
- [ ] Select diagnosis (e.g., "Caries")
- [ ] Tooth shows selected diagnosis
- [ ] Auto-diagnosis text appears: "Diente 11: Caries"
- [ ] Select multiple teeth
- [ ] Auto-diagnosis shows all selections

### 1.4 Manual Diagnosis
- [ ] Add text to manual diagnosis field
- [ ] Preview shows auto + manual diagnosis combined
- [ ] Clear manual diagnosis
- [ ] Preview shows only auto diagnosis

### 1.5 Create Session
- [ ] Click "Nueva Sesión" in SessionsTable
- [ ] Session is created with BORRADOR badge
- [ ] Add procedure items
- [ ] Budget calculates correctly
- [ ] Balance calculates correctly
- [ ] Session date defaults to today

### 1.6 Save Record
- [ ] Click "Guardar Historia" (or Ctrl+S)
- [ ] Success toast appears
- [ ] BORRADOR badge changes to green checkmark
- [ ] Patient ID is assigned
- [ ] Session ID is assigned

### 1.7 Search Patient
- [ ] Click "Búsqueda de pacientes" (or Ctrl+K)
- [ ] Search dialog opens
- [ ] Search by name works
- [ ] Search by document ID works
- [ ] Select patient loads data
- [ ] Odontogram loads correctly
- [ ] Sessions load correctly

---

## 2. Layout Mode Tests

### 2.1 Initial Layout (Vertical)
- [ ] Application starts in vertical layout (default)
- [ ] All sections visible in scroll view:
  - [ ] Acciones Rápidas
  - [ ] Datos del Paciente
  - [ ] Odontograma
  - [ ] Diagnóstico
  - [ ] Evolución y Procedimientos
  - [ ] Historial Financiero (if saved sessions exist)
  - [ ] Adjuntos

### 2.2 Switch to Tabs Layout
- [ ] Open ThemePanel (Personalización button)
- [ ] Click "Diseño con Pestañas"
- [ ] Layout changes to tabs
- [ ] **CRITICAL:** All patient data is preserved
  - [ ] Patient form still filled
  - [ ] Odontogram selections preserved
  - [ ] Draft sessions preserved
  - [ ] Attachments preserved
  - [ ] Manual diagnosis preserved

### 2.3 Tabs Navigation
- [ ] Tabs are visible:
  - [ ] Odontograma y Diagnóstico
  - [ ] Evolución y Procedimientos
  - [ ] Historial Financiero
  - [ ] Adjuntos
- [ ] Click each tab
- [ ] Content switches correctly
- [ ] Data is preserved when switching tabs

### 2.4 Switch Back to Vertical
- [ ] Open ThemePanel
- [ ] Click "Diseño Vertical"
- [ ] Layout changes back to vertical
- [ ] **CRITICAL:** All data still preserved
  - [ ] Patient form still filled
  - [ ] Odontogram selections preserved
  - [ ] Draft sessions preserved
  - [ ] Attachments preserved

### 2.5 Multiple Layout Switches
- [ ] Switch to tabs → vertical → tabs → vertical
- [ ] Data preserved through all switches
- [ ] No console errors
- [ ] No visual glitches

---

## 3. Data Loss Prevention Tests

### 3.1 Without Draft Sessions
- [ ] Create new patient record
- [ ] Fill patient form
- [ ] Save (no draft sessions)
- [ ] Try to close browser tab
- [ ] **Expected:** No warning shown (data is saved)

### 3.2 With Draft Sessions
- [ ] Create new patient record
- [ ] Fill patient form
- [ ] Create draft session (don't save)
- [ ] Try to close browser tab
- [ ] **Expected:** Browser shows warning
- [ ] Click "Stay" → page stays open
- [ ] Draft session still present

### 3.3 After Saving Drafts
- [ ] Create draft session
- [ ] Save patient record
- [ ] Try to close browser tab
- [ ] **Expected:** No warning (drafts are saved)

### 3.4 Layout Switch with Drafts
- [ ] Create draft session (don't save)
- [ ] Switch layout
- [ ] **Expected:** No browser warning (component doesn't unmount)
- [ ] Draft session preserved
- [ ] Can still save draft

---

## 4. Database Persistence Tests

### 4.1 Layout Preference - Initial State
- [ ] Open DevTools → Application → Storage
- [ ] Check `user_settings` table (via SQL query)
- [ ] `layoutMode` key may not exist (default: 'vertical')

### 4.2 Layout Preference - Save
- [ ] Switch to "Diseño con Pestañas"
- [ ] Check `user_settings` table
- [ ] `layoutMode` = 'tabs' exists
- [ ] `category` = 'appearance'

### 4.3 Layout Preference - Restart App
- [ ] Close application completely
- [ ] Reopen application
- [ ] **Expected:** Tabs layout is active (loads from database)
- [ ] Switch to vertical
- [ ] Restart again
- [ ] **Expected:** Vertical layout is active

---

## 5. URL Parameter Tests

### 5.1 Direct URL with Patient ID (Vertical)
- [ ] Set layout to vertical
- [ ] Navigate to: `/?patientId=1` (use existing patient ID)
- [ ] Patient loads automatically
- [ ] Success toast: "Paciente cargado"
- [ ] Patient data displayed
- [ ] Odontogram loaded
- [ ] Sessions loaded

### 5.2 Direct URL with Patient ID (Tabs)
- [ ] Set layout to tabs
- [ ] Navigate to: `/?patientId=1`
- [ ] Patient loads automatically
- [ ] Patient card shown (not edit form)
- [ ] All tabs accessible
- [ ] Data loaded correctly

### 5.3 Invalid Patient ID
- [ ] Navigate to: `/?patientId=99999`
- [ ] Warning toast: "Paciente no encontrado"
- [ ] URL parameter cleared
- [ ] Empty form shown

### 5.4 URL Clear on New Patient
- [ ] Load patient via URL (`/?patientId=1`)
- [ ] Click "Nueva historia"
- [ ] Confirm dialog
- [ ] URL parameter cleared (`/?patientId=1` → `/`)
- [ ] Form is empty

---

## 6. Keyboard Shortcuts Tests

All shortcuts should work in both layouts:

### 6.1 Ctrl+S (Save)
- [ ] Create/edit patient record
- [ ] Press Ctrl+S (Cmd+S on Mac)
- [ ] Record saves
- [ ] Success toast shown
- [ ] Default browser save dialog prevented

### 6.2 Ctrl+K (Search)
- [ ] Press Ctrl+K (Cmd+K on Mac)
- [ ] Search dialog opens
- [ ] Can search for patients
- [ ] Default browser search prevented

### 6.3 Ctrl+N (New)
- [ ] Press Ctrl+N (Cmd+N on Mac)
- [ ] New patient form shown
- [ ] Default browser new window prevented

### 6.4 Ctrl+P (Print)
- [ ] Press Ctrl+P (Cmd+P on Mac)
- [ ] Print preview opens
- [ ] Content formatted correctly

---

## 7. Quick Payment Modal Tests

### 7.1 Quick Payment - Vertical Layout
- [ ] Load patient with saved sessions
- [ ] Scroll to "Historial Financiero"
- [ ] Click "Abono rápido"
- [ ] Modal opens
- [ ] Enter payment amount
- [ ] Select payment method
- [ ] Add notes
- [ ] Save
- [ ] Success toast shown
- [ ] Session list updates

### 7.2 Quick Payment - Tabs Layout
- [ ] Switch to tabs layout
- [ ] Load patient with saved sessions
- [ ] Go to "Historial Financiero" tab
- [ ] Click "Abono rápido"
- [ ] Modal works same as vertical
- [ ] Payment saves correctly

---

## 8. Attachments Tests

### 8.1 Upload Attachment - Vertical
- [ ] Scroll to Adjuntos section
- [ ] Click "Seleccionar archivos"
- [ ] Select image file
- [ ] Preview shows
- [ ] Save patient record
- [ ] Attachment saved to disk
- [ ] Attachment metadata in database

### 8.2 Upload Attachment - Tabs
- [ ] Switch to tabs layout
- [ ] Go to Adjuntos tab
- [ ] Upload works same as vertical

### 8.3 Open Attachment
- [ ] Click attachment name
- [ ] File opens in OS default app

### 8.4 Delete Attachment
- [ ] Click delete button
- [ ] Confirmation dialog
- [ ] Delete from database
- [ ] File removed from disk

---

## 9. Master Data Management

### 9.1 Procedure Templates
- [ ] Open SessionsTable
- [ ] Click "Editar Plantilla"
- [ ] Add new procedure
- [ ] Save template
- [ ] Template appears in dropdown
- [ ] Switch layout
- [ ] Template still available

### 9.2 Signers (Doctors)
- [ ] Open SessionsTable
- [ ] Click "Gestionar Doctores"
- [ ] Add new doctor
- [ ] Doctor appears in dropdown
- [ ] Switch layout
- [ ] Doctor still available

### 9.3 Reason Types
- [ ] Open SessionsTable
- [ ] Click "Gestionar Motivos"
- [ ] Add new reason type
- [ ] Reason appears in dropdown
- [ ] Switch layout
- [ ] Reason still available

---

## 10. Edge Cases & Error Handling

### 10.1 Empty Database
- [ ] Delete clinic.db
- [ ] Restart application
- [ ] Database recreated
- [ ] Migrations run
- [ ] Default data inserted
- [ ] No errors in console

### 10.2 Very Long Patient Name
- [ ] Enter 500 character name
- [ ] Form handles gracefully
- [ ] Save succeeds
- [ ] Name displays truncated where needed

### 10.3 Many Sessions
- [ ] Create patient with 50+ sessions
- [ ] SessionsTable renders
- [ ] Scroll works smoothly
- [ ] Layout switch preserves all sessions

### 10.4 Large Attachments
- [ ] Upload 50MB image
- [ ] Progress indicator shown
- [ ] Save succeeds
- [ ] File opens correctly

### 10.5 Network Interruption
- [ ] Simulate database lock
- [ ] Try to save
- [ ] Error toast shown
- [ ] Data not lost
- [ ] Can retry save

### 10.6 Concurrent Edits
- [ ] Open patient in two windows
- [ ] Edit in window 1
- [ ] Edit in window 2
- [ ] Save both
- [ ] Last write wins (no crash)

---

## 11. Performance Tests

### 11.1 Layout Switch Speed
- [ ] Load patient with 20 sessions
- [ ] Switch from vertical to tabs
- [ ] **Expected:** < 100ms (instant)
- [ ] No loading spinner
- [ ] No flickering

### 11.2 Odontogram Responsiveness
- [ ] Click 32 teeth rapidly
- [ ] All selections register
- [ ] Auto-diagnosis updates smoothly
- [ ] No lag

### 11.3 Large Form Save
- [ ] Fill all form fields
- [ ] Select 32 teeth diagnoses
- [ ] Create 5 sessions with 10 items each
- [ ] Upload 5 attachments
- [ ] Save
- [ ] **Expected:** < 2 seconds
- [ ] Success toast shown

---

## 12. Accessibility Tests

### 12.1 Keyboard Navigation
- [ ] Tab through all form fields
- [ ] Focus visible on all elements
- [ ] Enter/Space activates buttons
- [ ] Escape closes dialogs

### 12.2 Screen Reader (Optional)
- [ ] Navigate with screen reader
- [ ] Form labels read correctly
- [ ] Buttons have descriptive text
- [ ] Errors announced

### 12.3 High Contrast Mode
- [ ] Enable OS high contrast mode
- [ ] All text readable
- [ ] Buttons have visible borders
- [ ] Focus indicators visible

---

## 13. Theme & Appearance Tests

### 13.1 Dark Mode + Vertical Layout
- [ ] Switch to dark theme
- [ ] Switch to vertical layout
- [ ] All text readable
- [ ] No color contrast issues
- [ ] Action buttons styled correctly

### 13.2 Dark Mode + Tabs Layout
- [ ] Switch to dark theme
- [ ] Switch to tabs layout
- [ ] Tabs visible and readable
- [ ] Content legible
- [ ] No visual glitches

### 13.3 Light Mode + Both Layouts
- [ ] Switch to light theme
- [ ] Test vertical layout
- [ ] Test tabs layout
- [ ] All elements visible

### 13.4 Custom Brand Color
- [ ] Change brand color in ThemePanel
- [ ] Action buttons use new color
- [ ] Links use new color
- [ ] Tabs use new color (when active)

---

## 14. Regression Tests

### 14.1 Patient Search Dialog
- [ ] Open search dialog (Ctrl+K)
- [ ] Type to search
- [ ] Results filter live
- [ ] Select patient
- [ ] Dialog closes
- [ ] Patient loads

### 14.2 Pending Payments Dialog
- [ ] Click "Cartera de pendientes"
- [ ] Dialog opens
- [ ] Shows patients with debt
- [ ] Amounts correct
- [ ] Select patient
- [ ] Patient loads

### 14.3 Print Preview
- [ ] Load patient record
- [ ] Click "Imprimir" (or Ctrl+P)
- [ ] Print preview opens
- [ ] Content formatted for A4
- [ ] Patient data visible
- [ ] Odontogram visible (if possible)

### 14.4 Allergy Warning
- [ ] Add allergy to patient
- [ ] Red "ALERGIA" badge appears
- [ ] Badge visible in vertical layout
- [ ] Badge visible in tabs layout (on patient card)
- [ ] Badge animates (pulse)

---

## 15. Post-Deployment Verification

### 15.1 Production Build
- [ ] Run `pnpm tauri:build`
- [ ] Build succeeds
- [ ] No errors in console during build
- [ ] Installer created

### 15.2 Installed App
- [ ] Install application
- [ ] Run installed version
- [ ] All features work
- [ ] Database created in correct location
- [ ] Attachments saved in correct location

### 15.3 User Acceptance
- [ ] Demo to real user
- [ ] User creates patient record
- [ ] User switches layouts
- [ ] User confirms data preserved
- [ ] User satisfied with UX

---

## Test Results Summary

| Category | Tests | Passed | Failed | Notes |
|----------|-------|--------|--------|-------|
| Basic Functionality | 7 | | | |
| Layout Mode | 5 | | | |
| Data Loss Prevention | 4 | | | |
| Database Persistence | 3 | | | |
| URL Parameters | 4 | | | |
| Keyboard Shortcuts | 4 | | | |
| Quick Payment | 2 | | | |
| Attachments | 4 | | | |
| Master Data | 3 | | | |
| Edge Cases | 6 | | | |
| Performance | 3 | | | |
| Accessibility | 3 | | | |
| Theme & Appearance | 4 | | | |
| Regression | 4 | | | |
| Deployment | 3 | | | |
| **TOTAL** | **59** | | | |

---

## Critical Path Tests (Must Pass)

These are the absolute minimum tests that MUST pass before deployment:

1. ✅ [ ] TypeScript compiles without errors
2. ✅ [ ] Production build succeeds
3. [ ] **Layout switch preserves patient data**
4. [ ] **Layout switch preserves odontogram**
5. [ ] **Layout switch preserves draft sessions**
6. [ ] **Browser warns on close with unsaved drafts**
7. [ ] **Layout preference persists after restart**
8. [ ] **Save patient record (vertical layout)**
9. [ ] **Save patient record (tabs layout)**
10. [ ] **Load patient via URL (both layouts)**

---

## Known Issues / Limitations

Document any issues found during testing:

| Issue | Severity | Workaround | Fix Required? |
|-------|----------|------------|---------------|
| (none yet) | | | |

---

## Testing Sign-off

- [ ] All critical path tests passed
- [ ] No P0/P1 bugs found
- [ ] Performance acceptable
- [ ] User acceptance obtained
- [ ] Documentation updated

**Tested by:** _________________
**Date:** _________________
**Approved by:** _________________
**Date:** _________________

---

**Document Version:** 1.0
**Last Updated:** 2025-12-11
**Project:** Dentix - Dental Clinic Management System
