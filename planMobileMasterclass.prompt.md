## Plan: Mobile-First UI Refresh and Premium Branding

TL;DR: Update the frontend to a true mobile-first layout by converting the admin layout to a responsive stacked structure, adding a mobile hamburger side-drawer, enhancing the logo with shimmer and pulse motion, polishing the auth screens, and replacing static developer footers with a premium animated signature.

**Steps**
1. Update global styling in `frontend/src/index.css`.
   - Reinforce `Urbanist` global font usage and system fallback.
   - Add mobile-first spacing and container rules using viewport units and clamps.
   - Add new motion keyframes for shimmer, pulse, text glitch, and glow expand.
   - Add responsive base styles for buttons, inputs, headers, and cards to raise tap target sizes.
   - Add glassmorphism header/backdrop utilities and improved form/card scaling.

2. Redesign the admin layout in `frontend/src/App.jsx`.
   - Add state for `mobileMenuOpen` and a hamburger toggle button in the top header.
   - Convert the admin container to mobile-first layout with `flex flex-col md:flex-row`.
   - Hide the sidebar by default on small screens and render it as a sliding drawer overlay.
   - Add an animated backdrop/blur header and space the top bar for finger-friendly taps.
   - Ensure the `Logo` appears in the header and the brand wordmark is visible.
   - Update the sidebar footer to use the premium signature link consistently.

3. Enhance login/auth screens.
   - Add `Logo` to `frontend/src/Login.jsx` header and use shimmer/pulse styles.
   - Update `Login.jsx` to use a responsive hero card container and larger touch-friendly controls.
   - Replace the static footer link with `DevSignature` or the same premium motion style.
   - Apply similar responsive/polished updates in `frontend/src/Register.jsx`, `frontend/src/Verification.jsx`, and `frontend/src/Welcome.jsx` for consistent branding.

4. Improve the shared `Logo` component in `frontend/src/Logo.jsx`.
   - Add a subtle on-load pulse and shimmer overlay animation.
   - Keep the existing motion-based glow but make it feel more premium on mobile.
   - Ensure the logo scales cleanly using Tailwind width/height classes and responsive SVG settings.

5. Refine `frontend/src/DevSignature.jsx`.
   - Add a hover variant that triggers a text glitch / expand and glow animation with Framer Motion.
   - Use the premium signature language and preserve the external link.
   - Replace duplicated footer markup where possible by reusing this component.

**Verification**
1. Run the app and confirm the login page shows the university logo, shimmer animation, and responsive form card at phone widths.
2. Resize the admin layout to a phone width and verify the header shows a hamburger button and the sidebar slides in/out as a drawer.
3. Confirm the top header uses a blurred translucent glass look and spacing prevents text from touching screen edges.
4. Hover the developer link in the footer and verify the text glitch / expand glow animation triggers.
5. Manually inspect `index.css` and pages to ensure buttons/inputs are at least 56px tall on mobile and use viewport/clamp sizing.

**Decisions**
- Keep the current neon lime brand palette and use the existing `Urbanist` font import.
- Implement the mobile drawer for the admin sidebar, since the current layout is desktop-first.
- Use the existing developer signature name `M.GH.AL` for the premium footer.
- Focus on auth screens and core admin/dashboard wrapper rather than redesigning every internal page.

**Further Considerations**
1. Should the mobile drawer also be applied to the student layout, or keep it for the admin navigation only?  
2. If you want, I can also create a small reusable `PageShell` component for header/footer consistency across auth pages.
