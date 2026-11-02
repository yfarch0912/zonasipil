# Phase 8 — Human Screen-Reader Test Checklist

Status: **NOT EXECUTED** — NVDA/JAWS/VoiceOver are unavailable in the
build environment. This checklist is the reproducible procedure for a
human tester to convert the NOT_EVALUATED items into evidence.
Recommended setup: Windows + NVDA (latest) + Chrome (latest);
alternatively VoiceOver + Safari on macOS. Serve the production
build (`npm run build` then `npm run preview`) or open the deployed
preview, and record NVDA/Chrome versions with the results.

## A. Dashboard
1. Land on the dashboard. Tab through the page: project name field,
   template select, "Buat & buka di editor", search, import are all
   reached in a sensible order and announced with meaningful names.
2. Load sample 01 ("Muat contoh"). Confirm the editor opens and the
   screen reader lands in the editor without getting stuck.
3. With a mobile user agent or a real phone + TalkBack/VoiceOver:
   open the editor; the "Saran tampilan layar" dialog is announced
   as a dialog with its label; "Tetap Lanjutkan" is reachable and
   dismisses it; focus returns sensibly; Escape (with a keyboard)
   also dismisses it.

## B. Analysis announcements
4. Open sample 01, go to Analisis. The polite announcement
   "Analisis selesai. Klasifikasi: …" is spoken once, in Indonesian.
5. Build an unstable model (two nodes, one member, no supports) and
   open Analisis: the assertive announcement "Analisis gagal…" is
   spoken.
6. Save a project from the dashboard: "Proyek berhasil disimpan" is
   spoken. (Failure path is covered by automation; a human can skip
   the failure case.)

## C. Data Tabel modelling (keyboard + screen reader)
7. Switch to Data Tabel. Navigate the Simpul table: column headers
   are announced; coordinate fields are announced with the node id
   (e.g. "Koordinat X simpul n1").
8. Add a node, a member, a point load, and a distributed load using
   only the keyboard. Trigger the distributed-load validation error
   (type "abc" as w awal): the error text is announced/visible and
   no load is created.
9. Run "Jalankan Analisis": the results tables' reaction values are
   readable cell by cell (expected for a 5 m beam with −10 kN point
   load: Ry = 5.000 at both supports).
10. Delete a node: the confirmation dialog is announced as an alert
    dialog, lists the dependents (its member), focus starts on
    "Batal"; cancel with Escape — the node survives; repeat and
    confirm — node and member are gone.

## D. Dialogs & focus
11. On an unstable model, open Analisis: the issues dialog is
    announced as a dialog, focus is inside it, and Escape closes it.
12. General: at no point does keyboard focus become invisible or
    land on a control with no announced name. Note any occurrence
    with the control's location.

## Recording results
For each numbered item record PASS / FAIL + what the screen reader
actually said (verbatim where it matters). File the completed
checklist as an addendum to docs/PHASE-8-ACCESSIBILITY-VALIDATION.md;
only then may the screen-reader status change from NOT_EVALUATED.
