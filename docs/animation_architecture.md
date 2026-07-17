# Immersive Animation Architecture Specification
*Reference Document for Hyper-Interactive Immersive Narrative*

This document serves as a spec sheet for implementing modern, cinematic, and performance-optimized interactive animation systems. It documents the core behaviors, parameters, performance practices, and accessibility rules.

---

## 1. Core Architecture Details

### Theme & Libraries
* **Theme:** Hyper-Interactive Immersive Narrative
* **Permitted Interaction Engines:**
  - **Framer Motion:** Staggered components, layout transitions, and fluid micro-interactions.
  - **GSAP (GreenSock):** Complex timelines, scroll scrub controls, and canvas animations.
  - **Three.js:** WebGL rendering, mesh deformation, and camera-based Z-tunnel movements.
  - **Tailwind CSS:** Responsive layouts, utility-based visual styling, and transitions.

---

## 2. Global Interactions & Triggers

### 🖱️ Magnetic Liquid Custom Cursor
- **Type:** Magnetic Liquid Custom Cursor
- **Behavior:** 
  A `20px` fluid circle that stretches on high-velocity movement. It magnetizes to elements with the `data-magnetic` attribute, expanding to enclose them with an internal blending mode of `difference`.

### 📜 Bi-Directional Kinetic Scrubbing
- **Type:** Scroll-Based Kinetic Scrubbing
- **Behavior:**
  Smooth scrolling via Lenis or GSAP ScrollSmoother, linking horizontal grid shifts and 3D camera depths directly to the vertical scroll percentage (y-axis).

---

## 3. Node Specifications

| Node ID | Component | Interaction Type | Animation Details & Behaviors |
| :--- | :--- | :--- | :--- |
| **hero_01** | **Kinetic Typography Landing Canvas** | SVG Path Morph & Character Explode | Split text into individual characters using `span`. On page load, characters stagger upward from `y: 100`, changing scale from `0.3` to `1.0` with a bounce physics curve (`mass: 0.8`, `stiffness: 100`). Simultaneously, a background SVG fluid shape morphs from a sharp polygon to a soft, rotating organic blob. Letters within a `150px` radius of the custom cursor lean dynamically away from it using CSS 3D transforms (`rotateX` and `rotateY`). |
| **showcase_02** | **Infinite Z-Axis Tunnel Matrix** | Three.js Mesh Displacement & Scroll Scrubbing | A grid of 3D image texture plates floating in a WebGL canvas. As the user enters this viewport section, the elements arrange into a deep perspective tunnel. Scrolling forward drives the WebGL camera deeper into the Z-axis tunnel. As an image plate passes the camera plane, it triggers a custom chromatic aberration flash effect across the RGB channels. |
| **content_03** | **Asymmetric Bento Grid System** | Staggered Reveal, Border Draw & Card Hover | Bento grid cards fade in sequentially using CSS Grid properties and Tailwind transforms. Grid card borders utilize an SVG stroke-dasharray animation that draws itself completely over `1.2` seconds. The active card expands its grid weight slightly (`flex-grow` or `grid-column-end` transition), pushing neighboring cards aside softly. The background of the active card shifts dynamically based on cursor coordinates via a CSS canvas gradient. |
| **cta_04** | **Magnetic Portal Trigger** | Infinite Marquee Reverse Loop & Click Ripple | Text loops seamlessly across the x-axis. A secondary layer loops in the exact opposite direction behind it. Clicking triggers an intentional page-inversion ripple effect: a localized circular mask expands rapidly from the exact pixel coordinate of the click event, completely repainting the viewport color palette into an inverted dark/light theme. |

---

## 4. Performance & Hardware Acceleration

To guarantee a fluid experience locked at **60 FPS** (or matches display refresh rate e.g. 120Hz/144Hz):

- **Force GPU Rendering:** Always use `transform: translate3d(x, y, z)` or `translateZ(0)` rather than standard `top`, `left`, `margin`, or `translate(x, y)` to trigger GPU compositing.
- **Layer Promotion:** Use the CSS `will-change` property on structurally heavy or continuously animated elements (e.g., `will-change: transform, opacity`). Ensure it is applied sparingly before animations begin and removed when they end to prevent memory leaks.
- **Debounce Event Listeners:** Debounce cursor coordinates or scroll listeners, or route them through `requestAnimationFrame()` to avoid layout thrashing.

---

## 5. Kinetic Ease Optimization

To prevent user fatigue and ensure premium feel:
- **Cubic Bezier Easing:** Avoid linear or basic ease-in/out curves. Prefer premium cubic curves:
  - **Snappy Out:** `cubic-bezier(0.25, 1, 0.5, 1)`
  - **Power In-Out:** `cubic-bezier(0.76, 0, 0.24, 1)`
- **Spring Physics:** Use elastic spring configurations (e.g., in Framer Motion or React Spring) with appropriate stiffness and damping values to give interactive items physical weight and realistic rebound characteristics.

---

## 6. Accessibility & Motion Sensitivities

- **Honor System Settings:** Respect the user's system preferences using standard `prefers-reduced-motion` media queries.
- **Fallback Behavior:** When reduced motion is preferred, animations must fallback to immediate cuts, static layouts, or simple fades without structural shifts:
  ```css
  @media (prefers-reduced-motion: reduce) {
      *, ::before, ::after {
          animation-delay: -1ms !important;
          animation-duration: 1ms !important;
          animation-iteration-count: 1 !important;
          background-attachment: initial !important;
          scroll-behavior: auto !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
      }
      .reveal-on-scroll {
          opacity: 1 !important;
          transform: none !important;
      }
  }
  ```
