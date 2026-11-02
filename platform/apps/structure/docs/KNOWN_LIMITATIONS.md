# Known Limitations — STRUKTURA 1.0.0

## Analysis
1. **2D only.** No 3D frame elements, diaphragms, torsion in analysis,
   rigid offsets, or plate/shell elements. The architecture separates the
   solver so a 3D engine can be added (roadmap), but v1 must not be used as
   if it were a 3D building analysis.
2. **Linear static only.** No P-Delta/second-order, eigenvalue/modal,
   response-spectrum, time-history, or nonlinear analysis.
3. **Load types:** point loads, distributed loads (uniform/trapezoidal),
   self-weight. No applied nodal moments as a distinct load object in the
   model schema, no temperature/settlement loads. (A point load's moment
   effect must be modelled via member loads or an equivalent couple.)
4. **End releases:** only the built-in truss release (both-end moment
   release by condensation). General per-end hinge/spring releases are not
   user-configurable.
5. Supports: pin, roller (vertical restraint), fixed. No spring supports,
   no inclined rollers, no support settlement.
6. Shear deformation (Timoshenko) is optional and off by default.

## Design
7. Implemented subsets only — see SNI_IMPLEMENTATION_MATRIX.md. Notably
   UNSUPPORTED: full SNI 1726 seismic procedure (spectrum/ELF/drift),
   SNI 1727 load magnitude tables & wind procedure, two-way slabs, torsion
   design, connections (Bab J), steel minor-axis flexure, SNI 8460 geotech.
8. Design verdicts depend on user-entered reinforcement/section design
   inputs; the app does not auto-design a complete building.

## Platform
9. **No backend/accounts.** Projects live in one browser's localStorage
   (per-origin). Clearing site data deletes projects — export JSON backups.
10. Report PDF route is browser print (Save as PDF) of a generated HTML
    report — there is no server-side PDF renderer in v1.
11. The one-click report presents the service combination 1.0×(SW + all
    modelled cases); factored design combinations are reviewed in the
    editor's Analyze/Design tabs, not in the summary report.
12. Editor chunk is 624 kB (173 kB gzip) lazy-loaded after the dashboard;
    first paint (dashboard) is 239 kB JS (77 kB gzip) + 62 kB CSS (11 kB gzip).
13. Browser-based interactive workflow (create → analyze → report → reload)
    is code- and test-verified at module level; an automated Playwright
    end-to-end run is not part of v1's test suite (see TESTING_REPORT.md).
14. The foundation's mobile warning screen remains: the editor targets
    desktop-size screens.

## Engineering disclaimer
Educational/professional-assist tool. Results must be reviewed by a licensed
structural engineer before any construction use. No certification is claimed.
