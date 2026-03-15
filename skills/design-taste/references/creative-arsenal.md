# Creative Arsenal

Do not default to generic UI. Pull from this library of advanced concepts to ensure output is visually striking and memorable.

When appropriate, leverage **GSAP (ScrollTrigger/Parallax)** for complex scrolltelling or **Three.js/WebGL** for 3D/Canvas animations, rather than basic CSS motion.

**Critical:** Never mix GSAP/Three.js with Framer Motion in the same component tree. Default to Framer Motion for UI/Bento interactions. Use GSAP/Three.js EXCLUSIVELY for isolated full-page scrolltelling or canvas backgrounds, wrapped in strict `useEffect` cleanup blocks.

---

## The Standard Hero Paradigm

Stop doing centered text over a dark image. Try asymmetric Hero sections: text cleanly aligned to the left or right. The background should feature a high-quality, relevant image with a subtle stylistic fade (darkening or lightening gracefully into the background color depending on light or dark mode).

---

## Navigation and Menus

- **Mac OS Dock Magnification.** Navbar at the edge; icons scale fluidly on hover.
- **Magnetic Button.** Buttons that physically pull toward the cursor.
- **Gooey Menu.** Sub-items detach from the main button like a viscous liquid.
- **Dynamic Island.** A pill-shaped UI component that morphs to show status/alerts.
- **Contextual Radial Menu.** A circular menu expanding exactly at the click coordinates.
- **Floating Speed Dial.** A FAB that springs out into a curved line of secondary actions.
- **Mega Menu Reveal.** Full-screen dropdowns that stagger-fade complex content.

---

## Layout and Grids

- **Bento Grid.** Asymmetric, tile-based grouping (e.g., Apple Control Center style).
- **Masonry Layout.** Staggered grid without fixed row heights (e.g., Pinterest style).
- **Chroma Grid.** Grid borders or tiles with subtle, continuously animating color gradients.
- **Split Screen Scroll.** Two screen halves sliding in opposite directions on scroll.
- **Curtain Reveal.** A Hero section parting in the middle like a curtain on scroll.

---

## Cards and Containers

- **Parallax Tilt Card.** A 3D-tilting card tracking the mouse coordinates.
- **Spotlight Border Card.** Card borders that illuminate dynamically under the cursor.
- **Glassmorphism Panel.** True frosted glass with inner refraction borders (1px inner border + inner shadow).
- **Holographic Foil Card.** Iridescent, rainbow light reflections shifting on hover.
- **Tinder Swipe Stack.** A physical stack of cards the user can swipe away.
- **Morphing Modal.** A button that seamlessly expands into its own full-screen dialog container.

---

## Scroll Animations

- **Sticky Scroll Stack.** Cards that stick to the top and physically stack over each other.
- **Horizontal Scroll Hijack.** Vertical scroll translates into a smooth horizontal gallery pan.
- **Locomotive Scroll Sequence.** Video/3D sequences where framerate is tied directly to the scrollbar.
- **Zoom Parallax.** A central background image zooming in/out seamlessly as you scroll.
- **Scroll Progress Path.** SVG vector lines or routes that draw themselves as the user scrolls.
- **Liquid Swipe Transition.** Page transitions that wipe the screen like a viscous liquid.

---

## Galleries and Media

- **Dome Gallery.** A 3D gallery feeling like a panoramic dome.
- **Coverflow Carousel.** 3D carousel with the center focused and edges angled back.
- **Drag-to-Pan Grid.** A boundless grid you can freely drag in any compass direction.
- **Accordion Image Slider.** Narrow vertical/horizontal image strips that expand fully on hover.
- **Hover Image Trail.** The mouse leaves a trail of popping/fading images behind it.
- **Glitch Effect Image.** Brief RGB-channel shifting digital distortion on hover.

---

## Typography and Text

- **Kinetic Marquee.** Endless text bands that reverse direction or speed up on scroll.
- **Text Mask Reveal.** Massive typography acting as a transparent window to a video background.
- **Text Scramble Effect.** Matrix-style character decoding on load or hover.
- **Circular Text Path.** Text curved along a spinning circular path.
- **Gradient Stroke Animation.** Outlined text with a gradient continuously running along the stroke.
- **Kinetic Typography Grid.** A grid of letters dodging or rotating away from the cursor.

---

## Micro-Interactions and Effects

- **Particle Explosion Button.** CTAs that shatter into particles upon success.
- **Liquid Pull-to-Refresh.** Mobile reload indicators acting like detaching water droplets.
- **Skeleton Shimmer.** Shifting light reflections moving across placeholder boxes.
- **Directional Hover Aware Button.** Hover fill entering from the exact side the mouse entered.
- **Ripple Click Effect.** Visual waves rippling precisely from the click coordinates.
- **Animated SVG Line Drawing.** Vectors that draw their own contours in real-time.
- **Mesh Gradient Background.** Organic, lava-lamp-like animated color blobs.
- **Lens Blur Depth.** Dynamic focus blurring background UI layers to highlight a foreground action.

---

## The "Motion-Engine" Bento Paradigm

When generating modern SaaS dashboards or feature sections, use this "Bento 2.0" architecture. It goes beyond static cards and enforces a high-end aesthetic heavily reliant on perpetual physics.

### Core Design Philosophy

- **Aesthetic:** High-end, minimal, and functional.
- **Palette:** Light neutral background (`#f9fafb`). Cards are pure white (`#ffffff`) with a 1px border at low opacity.
- **Surfaces:** Large border-radius (`rounded-[2.5rem]`) for major containers. Diffusion shadow (very light, wide-spreading, e.g., `shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]`) for depth without clutter.
- **Typography:** Strict `Geist`, `Satoshi`, or `Cabinet Grotesk` font stack. Tight tracking on headers.
- **Labels:** Titles and descriptions placed outside and below cards for a clean gallery-style presentation.
- **Padding:** Generous `p-8` or `p-10` inside cards.

### Animation Engine Specs (Perpetual Motion)

All cards must contain "Perpetual Micro-Interactions." Use these principles:

- **Spring physics.** No linear easing. Use `type: "spring", stiffness: 100, damping: 20` for a premium, weighty feel.
- **Layout transitions.** Heavily use `layout` and `layoutId` props for smooth re-ordering, resizing, and shared element transitions.
- **Infinite loops.** Every card should have an "Active State" that loops infinitely (Pulse, Typewriter, Float, or Carousel) so the interface feels alive.
- **Performance.** Wrap dynamic lists in `<AnimatePresence>` and optimize for 60fps. Any perpetual motion MUST be memoized (`React.memo`) and isolated in its own microscopic client component. Never trigger re-renders in the parent layout.

### The 5-Card Archetypes

Implement these micro-animations when constructing Bento grids (e.g., Row 1: 3 cols | Row 2: 2 cols split 70/30):

1. **The Intelligent List.** A vertical stack of items with an infinite auto-sorting loop. Items swap positions using `layoutId`, simulating an AI prioritizing tasks in real-time.
2. **The Command Input.** A search/AI bar with a multi-step Typewriter Effect. Cycles through complex prompts with a blinking cursor and a "processing" state with a shimmering loading gradient.
3. **The Live Status.** A scheduling interface with "breathing" status indicators. A pop-up notification badge emerges with an "Overshoot" spring effect, stays for 3 seconds, and vanishes.
4. **The Wide Data Stream.** A horizontal "Infinite Carousel" of data cards or metrics. Seamless loop (using `x: ["0%", "-100%"]`) at an effortless speed.
5. **The Contextual UI (Focus Mode).** A document view that animates a staggered highlight of a text block, followed by a "Float-in" of a floating action toolbar with micro-icons.

---

## Upgrade Techniques

When upgrading an existing project, pull from these high-impact techniques to replace generic patterns.

### Typography Upgrades

- **Variable font animation.** Interpolate weight or width on scroll or hover for text that feels alive.
- **Outlined-to-fill transitions.** Text starts as a stroke outline and fills with color on scroll entry or interaction.
- **Text mask reveals.** Large typography acting as a window to video or animated imagery behind it.

### Layout Upgrades

- **Broken grid / asymmetry.** Elements that deliberately ignore column structure -- overlapping, bleeding off-screen, or offset with calculated randomness.
- **Whitespace maximization.** Aggressive use of negative space to force focus on a single element.
- **Parallax card stacks.** Sections that stick and physically stack over each other during scroll.
- **Split-screen scroll.** Two halves of the screen sliding in opposite directions.

### Motion Upgrades

- **Smooth scroll with inertia.** Decouple scrolling from browser defaults for a heavier, cinematic feel.
- **Staggered entry.** Elements cascade in with slight delays, combining Y-axis translation with opacity fade. Never mount everything at once.
- **Spring physics.** Replace linear easing with spring-based motion for a natural, weighty feel on all interactive elements.
- **Scroll-driven reveals.** Content entering through expanding masks, wipes, or draw-on SVG paths tied to scroll progress.

### Surface Upgrades

- **True glassmorphism.** Go beyond `backdrop-filter: blur`. Add a 1px inner border and a subtle inner shadow to simulate edge refraction.
- **Spotlight borders.** Card borders that illuminate dynamically under the cursor.
- **Grain and noise overlays.** A fixed, `pointer-events-none` overlay with subtle noise to break digital flatness.
- **Colored, tinted shadows.** Shadows that carry the hue of the background rather than generic black.
