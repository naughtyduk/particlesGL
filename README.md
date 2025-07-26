# particlesGL – Universal WebGL Particle Effect

<a href="https://particlesgl.naughtyduk.com"><img src="/assets/particlesGL-promo-IMG.gif" alt="particlesGL" style="width: 100%"/></a>

**v1.0.0**

> [!NOTE]
> `particlesGL` uses a dual licence model. It is **free for personal use**. `particlesGL` requires a licence for commercial use, see the [licensing section](#licence) for more details.

`particlesGL` transforms any DOM element into beautiful, interactive particle systems with mouse displacement effects, rendered in high-performance WebGL.

<a href="https://particlesgl.naughtyduk.com" target="_blank" rel="noopener noreferrer"><img src="./assets/try-btn.svg" alt="Try It Out Button"></a>

<a href="https://particlesgl.naughtyduk.com/demos/demo-1.html" target="_blank" rel="noopener noreferrer"><strong>DEMO (3D)</strong></a> | <a href="https://particlesgl.naughtyduk.com/demos/demo-2.html" target="_blank" rel="noopener noreferrer"><strong>DEMO (AUDIO)</strong></a> | <a href="https://particlesgl.naughtyduk.com/demos/demo-3.html" target="_blank" rel="noopener noreferrer"><strong>DEMO (MULTIPLE)</strong></a> | <a href="https://particlesgl.naughtyduk.com/demos/demo-4.html" target="_blank" rel="noopener noreferrer"><strong>DEMO (CAMERA)</strong></a> | <a href="https://particlesgl.naughtyduk.com/demos/demo-5.html" target="_blank" rel="noopener noreferrer"><strong>DEMO (VIDEO)</strong></a> | <a href="https://particlesgl.naughtyduk.com/demos/demo-6.html" target="_blank" rel="noopener noreferrer"><strong>DEMO (EMOJI)</strong></a>

## Overview

`particlesGL` brings interactive particle effects to the web with a lightweight WebGL renderer. It converts any DOM element, images, SVGs, text, videos, or even 3D models, into responsive particle systems that react to mouse movement. The library features velocity-based interactions, meaning effects only appear when the cursor is actively moving, creating natural and performant user experiences.

### Key Features

| Feature                        | Supported | Feature                     | Supported |
| :----------------------------- | :-------: | :-------------------------- | :-------: |
| Image to Particles             |    ✅     | Velocity-Based Interactions |    ✅     |
| SVG to Particles               |    ✅     | Custom Characters/Emojis    |    ✅     |
| Text to Particles              |    ✅     | Particle Colour Control     |    ✅     |
| Video to Particles (Real-time) |    ✅     | Video as Particle Source    |    ✅     |
| 3D Models (GLTF/GLB)           |    ✅     | Font Customisation          |    ✅     |
| Mouse Displacement Effects     |    ✅     | Multiple Instances          |    ✅     |
| Tilt on Hover                  |    ✅     | Auto-Resize Handling        |    ✅     |
| Smooth Particle Return         |    ✅     | Lightweight & Performant    |    ✅     |
| Configurable Particle Size     |    ✅     | `on.init` Callback          |    ✅     |
| Adjustable Displacement Radius |    ✅     | Smart DOM Positioning       |    ✅     |
| Customisable Particle Spacing  |    ✅     | Particle Colour Sampling    |    ✅     |

---

## Prerequisites

Add the following scripts before you initialise `particlesGL()` (normally at the end of the `<body>`):

```html
<!-- Three.js – WebGL 3D library (required) -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>

<!-- GLTFLoader – For 3D model support (optional, only if using 3D models) -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/GLTFLoader.js"></script>

<!-- particlesGL.min.js – the library itself -->
<script src="/scripts/particlesGL.min.js"></script>
```

> `Three.js` provides the WebGL rendering engine that powers `particlesGL`. The library will not work without Three.js. `GLTFLoader` is only required if you plan to use 3D models.

---

## Quick Start

Set up your HTML structure first. Add the `particlesGL` class to any element you want to transform into particles.

```html
<!-- Example HTML structure -->
<body>
  <div class="hero-section">
    <!-- Target element (will be converted to particles) -->
    <img src="/logo.svg" alt="Logo" class="particlesGL" />
  </div>

  <!-- AND/OR use with text -->
  <h1 class="particlesGL">Hello World</h1>

  <!-- AND/OR with 3D models -->
  <div class="particlesGL" data-model-src="/assets/Duk_Animated.gltf"></div>

  <!-- AND/OR any other element -->
</body>
```

> The original element will be hidden and replaced with the particle system. Make sure your target elements are positioned where you want the particle effect to appear.

Next, initialise the library with your desired configuration.

```html
<script>
  document.addEventListener("DOMContentLoaded", () => {
    const particleEffect = particlesGL({
      target: ".particlesGL", // CSS selector for the element(s) to particlise
      character: "•", // Character/emoji to use for particles
      particleSize: 0.015, // Size of individual particles
      particleSpacing: 0.002, // Spacing between particles (for images/videos)
      particleColor: "sample", // Hex colour or 'sample' to extract colours from source pixels
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
      videoUpdateRate: 100, // Milliseconds between video frame updates
      modelScale: 1, // Scale factor for 3D models
      geometry: null, // Pre-computed particle positions for custom geometry
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

**HTML Data Attributes**

In addition to JavaScript options, `particlesGL` can be configured using data attributes on your HTML elements:

| Attribute               | Description                                                                                                                                                            |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `data-model-src`        | Specifies the path to a 3D model (`.gltf`, `.glb`) to be used as the particle source, overriding the element's content.                                                |
| `data-flip-horizontal`  | Set to `true` to invert the mouse displacement effect horizontally.                                                                                                    |
| `data-particles-target` | **Read-only**: An attribute added by the library to the generated `<canvas>` element. It contains a unique ID for the instance, useful for CSS selection or debugging. |

---

## Parameters

| Option              | Type     | Default          | Description                                                                                                |
| ------------------- | -------- | ---------------- | ---------------------------------------------------------------------------------------------------------- |
| `target`            | string   | `'.particlesGL'` | **Required.** CSS selector for the element(s) to convert to particles.                                     |
| `character`         | string   | `'•'`            | Character or emoji to use for particles.                                                                   |
| `particleSize`      | number   | `0.015`          | Size of individual particles (e.g., 0.001–0.1).                                                            |
| `particleSpacing`   | number   | `0.002`          | Spacing between particles for images/videos (e.g., 0.001–0.01). Not used for text elements.                |
| `particleColor`     | string   | `sample`         | Hex colour code for particles, or `'sample'` to extract colours from source pixels (images, videos, SVGs). |
| `sampling`          | number   | `4`              | Pixel sampling rate. Lower values = more particles, higher performance cost.                               |
| `tilt`              | boolean  | `false`          | Enable 3D tilt effect on mouse hover.                                                                      |
| `tiltFactor`        | number   | `0.2`            | Intensity of tilt effect (0–1).                                                                            |
| `tiltSpeed`         | number   | `0.05`           | Speed of tilt animation (0.01–0.2).                                                                        |
| `displaceStrength`  | number   | `0.6`            | Strength of mouse displacement effect (0–2).                                                               |
| `displaceRadius`    | number   | `0.1`            | Radius of displacement effect (0.01–0.5).                                                                  |
| `velocityInfluence` | number   | `0.3`            | How much mouse velocity affects displacement direction (0–2).                                              |
| `returnSpeed`       | number   | `0.05`           | Speed particles return to their original position (0.01–0.2).                                              |
| `fontSize`          | number   | `48`             | Font size for character particles (e.g., 12–72).                                                           |
| `fontFamily`        | string   | `'monospace'`    | Font family for character particles.                                                                       |
| `videoUpdateRate`   | number   | `100`            | Milliseconds between frame updates for real-time video support.                                            |
| `modelScale`        | number   | `1`              | Scale factor for 3D models (e.g., 0.5–5.0).                                                                |
| `geometry`          | array    | `null`           | Pre-computed particle positions for custom geometry. Array of [x, y, z] coordinates.                       |
| `on.init`           | function | `, `             | Callback that runs once the particle system is ready. Receives the instance as an argument.                |

> The `target` parameter is required; all others are optional.

---

## Presets

Below are some ready-made configurations for different effects:

| Name        | Settings                                                                                                        | Purpose                           |
| ----------- | --------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| **Subtle**  | `{ character: '•', particleSize: 0.01, displaceStrength: 0.3, displaceRadius: 0.05 }`                           | Minimal, elegant particle effect. |
| **Dynamic** | `{ character: '✨', particleSize: 0.025, displaceStrength: 1.2, displaceRadius: 0.2, tilt: true }`              | High-energy effect with tilt.     |
| **Organic** | `{ character: '◦', particleSize: 0.008, displaceStrength: 0.8, velocityInfluence: 0.6 }`                        | Natural, flowing movement.        |
| **Retro**   | `{ character: '█', particleSize: 0.02, particleColor: '#00ff00', fontFamily: 'monospace' }`                     | Pixel-art style effect.           |
| **Fire**    | `{ character: '🔥', particleSize: 0.03, displaceStrength: 1.5, displaceRadius: 0.15, particleColor: 'sample' }` | Flame-like particle movement.     |

---

## FAQ

| Question                                               | Answer                                                                                                                                                                                                                                                                                                                                                                                                                           |
| :----------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Does the library handle responsive design?             | Yes, `particlesGL` automatically handles window resize events and rebuilds particle systems as needed. Resize handling is debounced to 250ms for performance.                                                                                                                                                                                                                                                                    |
| What happens to the original element?                  | The original element is hidden (`visibility: hidden`) and replaced with the particle system. The particle system is inserted into the DOM and precisely matches the original element's position and dimensions.                                                                                                                                                                                                                  |
| Can I use custom fonts for character particles?        | Yes, use the `fontFamily` parameter to specify any loaded font. Make sure the font is loaded before you initialise `particlesGL`.                                                                                                                                                                                                                                                                                                |
| How do I optimise performance for many particles?      | Increase the `sampling` value to reduce particle count, use a smaller `particleSize`, and limit the number of simultaneous instances. The library also helps by automatically pausing rendering for particle systems that are off-screen (viewport culling).                                                                                                                                                                     |
| Can I update particle properties after initialisation? | Yes, use the `updateOptions()` method: `particleEffect.updateOptions({ particleColor: '#ff0000' })`. Most properties update in real-time. Only fundamental changes (like `target` or `geometry`) will cause the effect to be rebuilt, which the library handles automatically.                                                                                                                                                   |
| Does the effect work on mobile devices?                | Yes, `particlesGL` works on most modern mobile devices that support WebGL. Interaction is based on touch-and-drag events, which mimic a mouse. Touch-specific interactions like multi-touch are not supported.                                                                                                                                                                                                                   |
| What types of elements can be converted to particles?  | Images, SVGs, text, videos, and 3D models (GLTF/GLB format). For other HTML elements (like a `<div>` or `<p>`), the library will convert their text content into particles.                                                                                                                                                                                                                                                      |
| How does real-time video support work?                 | For video elements, particles are regenerated from the current video frame at the interval specified by `videoUpdateRate`. The effect only updates when the video is playing, providing a smooth, real-time animation that follows the video content. If you want to use video as the particle movement source but want to hide the video use `opacity: 0` on the video element, **do not hide it with the `display` property**. |
| Are there any CORS issues with images or 3D models?    | Images and 3D models from external domains may fail to load due to Cross-Origin Resource Sharing (CORS) policies. For best results, serve assets from the same domain or ensure the remote server provides the correct `Access-Control-Allow-Origin` headers.                                                                                                                                                                    |

---

## Browser Support

The `particlesGL` library is compatible with all modern WebGL-enabled browsers on desktop, tablet, and mobile devices.

| Browser        | Supported |
| :------------- | :-------: |
| Google Chrome  |    ✅     |
| Safari         |    ✅     |
| Firefox        |    ✅     |
| Microsoft Edge |    ✅     |
| Mobile Safari  |    ✅     |
| Mobile Chrome  |    ✅     |

> **Note**: Requires WebGL support. The library will fail to initialise if WebGL or Three.js are not available.

---

## Methods

After initialisation, you can control the particle system using the methods on the returned instance:

```javascript
const particleEffect = particlesGL({ target: ".particlesGL" });

// Re-initialise the effect if it has been cleaned up
particleEffect.init();

// Update particle properties on the fly
particleEffect.updateOptions({
  particleColor: "#ff0000",
  displaceStrength: 1.0,
});

// Access the current options object
console.log(particleEffect.options);

// Clean up the effect and restore the original element
particleEffect.cleanup();
```

---

## Licence

`particlesGL` is released under a dual-licence model to support both personal and commercial use. For full details, please see the [LICENCE](./LICENCE.md) file.

### Personal Use

For personal websites, portfolios, academic projects, and other non-commercial applications, `particlesGL` is free to use. In short, if you are not making money from your project, you can use `particlesGL` for free.

### Commercial Use

A paid commercial licence is required for any project that is commercial in nature. This includes websites for businesses, projects that generate revenue, or use in any proprietary software.

### Licensing Options

**Single Licence:**<br>
`For one commercial website or project.`<br><br>
<a href="https://pay.naughtyduk.com/b/fZu14n28abkraJG9RH9sk09" target="_blank" rel="noopener noreferrer"><img src="./assets/licence-btn.svg" alt="Get Licence Button"></a>

**Extended Licence:**<br>
`For up to five commercial projects.`<br><br>
<a href="https://pay.naughtyduk.com/b/fZuaEX8wy1JRbNK8ND9sk0a" target="_blank" rel="noopener noreferrer"><img src="./assets/licence-btn.svg" alt="Get Licence Button"></a>
