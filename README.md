# particlesGL – Interactive WebGL Particle Effects for the Web

<a href="https://particlesgl.naughtyduk.com"><img src="/assets/NDPGL-001.webp" alt="particlesGL" style="width: 100%"/></a>

**STABLE Release** - `now with velocity-based interactions`

> [!NOTE] > `particlesGL` has been built and tested across modern browsers with WebGL support. The library provides graceful fallbacks for older devices and optimizes performance automatically.

`particlesGL` transforms any DOM element into beautiful, interactive particle systems with mouse displacement effects, rendered in high-performance WebGL.

<a href="https://particlesgl.naughtyduk.com" target="_blank" rel="noopener noreferrer"><strong>TRY IT OUT</strong></a>

<a href="https://particlesgl.naughtyduk.com/demos/demo-1.html" target="_blank" rel="noopener noreferrer"><strong>DEMO 1</strong></a>

## Overview

`particlesGL` brings interactive particle effects to the web with an ultra-lightweight WebGL renderer. It converts any DOM element—images, SVGs, text, or even videos—into responsive particle systems that react to mouse movement. The library features velocity-based interactions, meaning effects only appear when the cursor is actively moving, creating natural and performant user experiences.

### Key Features

| Feature                        | Supported | Feature                     | Supported |
| :----------------------------- | :-------: | :-------------------------- | :-------: |
| Image to Particles             |    ✅     | Velocity-Based Interactions |    ✅     |
| SVG to Particles               |    ✅     | Custom Characters/Emojis    |    ✅     |
| Text to Particles              |    ✅     | Particle Color Control      |    ✅     |
| Video to Particles (Real-time) |    ✅     | Font Customization          |    ✅     |
| Mouse Displacement Effects     |    ✅     | Tilt on Hover               |    ✅     |
| Smooth Particle Return         |    ✅     | Multiple Instances          |    ✅     |
| Configurable Particle Size     |    ✅     | Auto-Resize Handling        |    ✅     |
| Adjustable Displacement Radius |    ✅     | Lightweight & Performant    |    ✅     |
| Customizable Particle Spacing  |    ✅     | `on.init` Callback          |    ✅     |

---

## Prerequisites

Add **both** of the following scripts before you initialise `particlesGL()` (normally at the end of the `<body>`):

```html
<!-- Three.js – WebGL 3D library (required) -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>

<!-- particlesGL.js – the library itself -->
<script src="/scripts/particlesGL.js"></script>
```

> `Three.js` provides the WebGL rendering engine that powers `particlesGL`. The library will throw if Three.js is not available.

---

## Quick start

Set up your HTML structure first. Add the `particlesGL` class to any element you want to transform into particles.

```html
<!-- Example HTML structure -->
<body>
  <!-- Target element (will be converted to particles) -->
  <div class="hero-section">
    <img src="/logo.svg" alt="Logo" class="particlesGL" />
  </div>

  <!-- Or use with text -->
  <h1 class="particlesGL">Hello World</h1>

  <!-- Or any other element -->
  <div class="particlesGL">
    <p>This content will become particles</p>
  </div>
</body>
```

> The original element will be hidden and replaced with the particle system. Make sure your target elements are positioned where you want the particle effect to appear.

Next, initialise the library with your desired configuration.

```html
<script>
  document.addEventListener("DOMContentLoaded", () => {
    const particleEffect = particlesGL({
      target: ".particlesGL", // CSS selector for the element(s) to particlize
      character: "•", // Character/emoji to use for particles
      particleSize: 0.015, // Size of individual particles
      particleSpacing: 0.002, // Spacing between particles
      particleColor: "#8c8c8c", // Color of particles
      sampling: 4, // Pixel sampling rate (lower = more particles)
      tilt: true, // Enable tilt effect on hover
      tiltFactor: 0.2, // Intensity of tilt effect
      tiltSpeed: 0.05, // Speed of tilt animation
      displaceStrength: 0.6, // Strength of mouse displacement
      displaceRadius: 0.1, // Radius of displacement effect
      velocityInfluence: 0.3, // How much mouse velocity affects displacement
      returnSpeed: 0.05, // Speed particles return to original position
      fontSize: 48, // Font size for character particles
      fontFamily: "monospace", // Font family for character particles
      on: {
        init(instance) {
          // The `init` callback fires once particlesGL has converted
          // the element and rendered the first frame
          console.log("particlesGL ready!", instance);
        },
      },
    });
  });
</script>
```

---

## Advanced Usage

### Multiple Elements

`particlesGL` can handle multiple elements with the same configuration:

```javascript
const particleEffect = particlesGL({
  target: ".particle-element", // Will affect all elements with this class
  character: "✨",
  particleSize: 0.02,
  // ... other options
});
```

### Custom Characters & Emojis

Use any character or emoji as particles:

```javascript
const particleEffect = particlesGL({
  target: ".particlesGL",
  character: "🔥", // Fire emoji
  // or
  character: "★", // Star character
  // or
  character: "◆", // Diamond shape
});
```

### Velocity-Based Interactions

The library automatically handles velocity-based interactions. Effects only appear when the cursor is moving:

- **Stationary cursor**: No effect visible
- **Moving cursor**: Effect appears and follows movement
- **Cursor stops**: Effect smoothly fades out

### Real-time Video Support

`particlesGL` supports real-time video conversion to particles:

```javascript
const videoEffect = particlesGL({
  target: "video", // Target a video element
  character: "🔥", // Fire emoji for video content
  videoUpdateRate: 100, // Update every 100ms
  // ... other options
});
```

- **Live Updates**: Particles reshape based on current video frame
- **Performance Optimized**: Configurable update rate (default 100ms)
- **Automatic Detection**: Works with any HTML5 video element
- **Smooth Transitions**: Particles smoothly transition between video frames

---

## Parameters

| Option              | Type     | Default          | Description                                                                  |
| ------------------- | -------- | ---------------- | ---------------------------------------------------------------------------- |
| `target`            | string   | `'.particlesGL'` | **Required.** CSS selector for the element(s) to convert to particles.       |
| `character`         | string   | `'•'`            | Character or emoji to use for particles.                                     |
| `particleSize`      | number   | `0.015`          | Size of individual particles (0.001–0.1).                                    |
| `particleSpacing`   | number   | `0.002`          | Spacing between particles (0.001–0.01).                                      |
| `particleColor`     | string   | `'#8c8c8c'`      | Hex color code for particles.                                                |
| `sampling`          | number   | `4`              | Pixel sampling rate. Lower values = more particles, higher performance cost. |
| `tilt`              | boolean  | `false`          | Enable 3D tilt effect on mouse hover.                                        |
| `tiltFactor`        | number   | `0.2`            | Intensity of tilt effect (0–1).                                              |
| `tiltSpeed`         | number   | `0.05`           | Speed of tilt animation (0.01–0.2).                                          |
| `displaceStrength`  | number   | `0.6`            | Strength of mouse displacement effect (0–2).                                 |
| `displaceRadius`    | number   | `0.1`            | Radius of displacement effect (0.01–0.5).                                    |
| `velocityInfluence` | number   | `0.3`            | How much mouse velocity affects displacement (0–2).                          |
| `returnSpeed`       | number   | `0.05`           | Speed particles return to original position (0.01–0.2).                      |
| `fontSize`          | number   | `48`             | Font size for character particles (12–72).                                   |
| `fontFamily`        | string   | `'monospace'`    | Font family for character particles.                                         |
| `videoUpdateRate`   | number   | `100`            | Milliseconds between video frame updates for real-time video support.        |
| `on.init`           | function | `—`              | Callback that runs once the particle system is ready. Receives the instance. |

> The `target` parameter is required; all others are optional.

---

## Presets

Below are some ready-made configurations for different effects:

| Name        | Settings                                                                                           | Purpose                           |
| ----------- | -------------------------------------------------------------------------------------------------- | --------------------------------- |
| **Subtle**  | `{ character: '•', particleSize: 0.01, displaceStrength: 0.3, displaceRadius: 0.05 }`              | Minimal, elegant particle effect. |
| **Dynamic** | `{ character: '✨', particleSize: 0.025, displaceStrength: 1.2, displaceRadius: 0.2, tilt: true }` | High-energy effect with tilt.     |
| **Organic** | `{ character: '◦', particleSize: 0.008, displaceStrength: 0.8, velocityInfluence: 0.6 }`           | Natural, flowing movement.        |
| **Retro**   | `{ character: '█', particleSize: 0.02, particleColor: '#00ff00', fontFamily: 'monospace' }`        | Pixel-art style effect.           |
| **Fire**    | `{ character: '🔥', particleSize: 0.03, displaceStrength: 1.5, displaceRadius: 0.15 }`             | Flame-like particle movement.     |

---

## FAQ

| Question                                               | Answer                                                                                                                                                                                                                                              |
| :----------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Does the library handle responsive design?             | Yes, `particlesGL` automatically handles window resize events and rebuilds particle systems as needed. Resize handling is debounced for performance.                                                                                                |
| What happens to the original element?                  | The original element is hidden (`visibility: hidden`) and replaced with the particle system. The particle system matches the original element's position and dimensions.                                                                            |
| Can I use custom fonts for character particles?        | Yes, use the `fontFamily` parameter to specify any loaded font. Make sure the font is loaded before initializing `particlesGL`.                                                                                                                     |
| How do I optimize performance for many particles?      | Increase the `sampling` value to reduce particle count, use smaller `particleSize` values, and limit the number of simultaneous instances. The library automatically culls off-screen particles.                                                    |
| Can I update particle properties after initialization? | Yes, use the `updateOptions()` method: `particleEffect.updateOptions({ particleColor: '#ff0000' })`. Some changes may require reinitializing the particle system.                                                                                   |
| Does the effect work on mobile devices?                | Yes, `particlesGL` is optimized for mobile devices with automatic performance scaling and touch event support.                                                                                                                                      |
| What types of elements can be converted to particles?  | Any DOM element: images, SVGs, text, videos, or complex HTML structures. The library uses canvas rendering to convert elements to particle data.                                                                                                    |
| How does real-time video support work?                 | For video elements, particles are regenerated based on the current video frame at the specified `videoUpdateRate`. The effect only updates when the video is playing, providing smooth real-time particle animation that follows the video content. |
| Are there any CORS issues with images?                 | Images from external domains may require CORS headers. For best results, serve images from the same domain or ensure proper `Access-Control-Allow-Origin` headers.                                                                                  |

---

## Performance Notes

- **Particle Count**: Controlled by `sampling` parameter. Lower values create more particles but require more processing power.
- **Mobile Optimization**: The library automatically adjusts performance settings for mobile devices.
- **Memory Management**: Particle systems are automatically cleaned up when elements are removed or the page is unloaded.
- **WebGL Context**: Uses a shared renderer architecture to prevent WebGL context limits.
- **Viewport Culling**: Particles outside the viewport are not processed, improving performance.

---

## Browser Support

The `particlesGL` library is compatible with all WebGL-enabled browsers on desktop, tablet, and mobile devices.

| Browser        | Supported |
| :------------- | :-------: |
| Google Chrome  |    ✅     |
| Safari         |    ✅     |
| Firefox        |    ✅     |
| Microsoft Edge |    ✅     |
| Mobile Safari  |    ✅     |
| Mobile Chrome  |    ✅     |

> **Note**: Requires WebGL support. The library includes feature detection and will warn if WebGL is not available.

---

## Methods

After initialization, you can control the particle system:

```javascript
const particleEffect = particlesGL({ target: ".particlesGL" });

// Update particle properties
particleEffect.updateOptions({
  particleColor: "#ff0000",
  displaceStrength: 1.0,
});

// Clean up the effect
particleEffect.cleanup();

// Reinitialize if needed
particleEffect.init();
```

---

## Important Notes

- The library automatically handles element visibility and replaces the original element with the particle system.
- Multiple instances are supported and share a single WebGL context for optimal performance.
- Particle systems are automatically cleaned up when the page is unloaded or when `cleanup()` is called.
- For best performance, avoid creating too many particle systems simultaneously on mobile devices.
- The velocity-based interaction system ensures effects only appear when the cursor is moving, creating natural and performant interactions.

---

## License

MIT © NaughtyDuk
