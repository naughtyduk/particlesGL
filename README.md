# particlesGL – Interactive WebGL Particle Effects for the Web

<a href="https://particlesgl.naughtyduk.com"><img src="/assets/NDPGL-001.webp" alt="particlesGL" style="width: 100%"/></a>

**STABLE Release** - `now with velocity-based interactions`

> [!NOTE] > `particlesGL` has been built for and tested on modern browsers with WebGL support. It optimises performance automatically through a shared renderer and viewport culling.

`particlesGL` transforms any DOM element into beautiful, interactive particle systems with mouse displacement effects, rendered in high-performance WebGL.

<a href="https://particlesgl.naughtyduk.com" target="_blank" rel="noopener noreferrer"><strong>TRY IT OUT</strong></a>

<a href="https://particlesgl.naughtyduk.com/demos/demo-1.html" target="_blank" rel="noopener noreferrer"><strong>DEMO 1</strong></a> | <a href="https://particlesgl.naughtyduk.com/demos/demo-2.html" target="_blank" rel="noopener noreferrer"><strong>DEMO 2</strong></a> | <a href="https://particlesgl.naughtyduk.com/demos/demo-3.html" target="_blank" rel="noopener noreferrer"><strong>DEMO 3</strong></a> | <a href="https://particlesgl.naughtyduk.com/demos/demo-4.html" target="_blank" rel="noopener noreferrer"><strong>DEMO 4</strong></a>

## Overview

`particlesGL` brings interactive particle effects to the web with a lightweight WebGL renderer. It converts any DOM element—images, SVGs, text, or even videos—into responsive particle systems that react to mouse movement. The library features velocity-based interactions, meaning effects only appear when the cursor is actively moving, creating natural and performant user experiences.

### Key Features

| Feature                        | Supported | Feature                     | Supported |
| :----------------------------- | :-------: | :-------------------------- | :-------: |
| Image to Particles             |    ✅     | Velocity-Based Interactions |    ✅     |
| SVG to Particles               |    ✅     | Custom Characters/Emojis    |    ✅     |
| Text to Particles              |    ✅     | Particle Colour Control     |    ✅     |
| Video to Particles (Real-time) |    ✅     | Particle Colour Sampling    |    ✅     |
| Mouse Displacement Effects     |    ✅     | Font Customisation          |    ✅     |
| Tilt on Hover                  |    ✅     | Multiple Instances          |    ✅     |
| Smooth Particle Return         |    ✅     | Auto-Resize Handling        |    ✅     |
| Configurable Particle Size     |    ✅     | Lightweight & Performant    |    ✅     |
| Adjustable Displacement Radius |    ✅     | `on.init` Callback          |    ✅     |
| Customizable Particle Spacing  |    ✅     | Smart DOM Positioning       |    ✅     |

---

## Prerequisites

Add the following scripts before you initialise `particlesGL()` (normally at the end of the `<body>`):

```html
<!-- Three.js – WebGL 3D library (required) -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>

<!-- particlesGL.js – the library itself -->
<script src="/scripts/particlesGL.js"></script>
```

> `Three.js` provides the WebGL rendering engine that powers `particlesGL`. The library will not work without it.

---

## Quick Start

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
    <p>This content will become particles.</p>
  </div>
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
      particleColour: "#8c8c8c", // Hex colour or 'sample' to use the element's colours
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

### Particle Colour Sampling

Set `particleColour: 'sample'` to make particles inherit the colour of the original element's pixels. This is perfect for creating vibrant, multi-coloured effects from images and videos.

```javascript
const imageEffect = particlesGL({
  target: "img.photo",
  particleColour: "sample", // Particles will match the image's colours
  character: "•",
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

- **Stationary cursor**: No effect visible.
- **Moving cursor**: Effect appears and follows movement.
- **Cursor stops**: Effect smoothly fades out.

### Real-time Video Support

`particlesGL` supports real-time video conversion to particles:

```javascript
const videoEffect = particlesGL({
  target: "video", // Target a video element
  character: "🔥", // Fire emoji for video content
  particleColour: "sample",
  videoUpdateRate: 100, // Update every 100ms
  // ... other options
});
```

- **Live Updates**: Particles reshape based on the current video frame.
- **Performance Optimised**: Configurable update rate (default 100ms).
- **Automatic Detection**: Works with any HTML5 video element.
- **Smooth Transitions**: Particles smoothly transition between video frames.

---

## Parameters

| Option              | Type     | Default          | Description                                                                                       |
| ------------------- | -------- | ---------------- | ------------------------------------------------------------------------------------------------- |
| `target`            | string   | `'.particlesGL'` | **Required.** CSS selector for the element(s) to convert to particles.                            |
| `character`         | string   | `'•'`            | Character or emoji to use for particles.                                                          |
| `particleSize`      | number   | `0.015`          | Size of individual particles (e.g., 0.001–0.1).                                                   |
| `particleSpacing`   | number   | `0.002`          | Spacing between particles for images/videos (e.g., 0.001–0.01). Not used for text elements.       |
| `particleColour`    | string   | `'#8c8c8c'`      | Hex colour code for particles, or `'sample'` to inherit colours from the source element's pixels. |
| `sampling`          | number   | `4`              | Pixel sampling rate. Lower values = more particles, higher performance cost.                      |
| `tilt`              | boolean  | `false`          | Enable 3D tilt effect on mouse hover.                                                             |
| `tiltFactor`        | number   | `0.2`            | Intensity of tilt effect (0–1).                                                                   |
| `tiltSpeed`         | number   | `0.05`           | Speed of tilt animation (0.01–0.2).                                                               |
| `displaceStrength`  | number   | `0.6`            | Strength of mouse displacement effect (0–2).                                                      |
| `displaceRadius`    | number   | `0.1`            | Radius of displacement effect (0.01–0.5).                                                         |
| `velocityInfluence` | number   | `0.3`            | How much mouse velocity affects displacement direction (0–2).                                     |
| `returnSpeed`       | number   | `0.05`           | Speed particles return to their original position (0.01–0.2).                                     |
| `fontSize`          | number   | `48`             | Font size for character particles (e.g., 12–72).                                                  |
| `fontFamily`        | string   | `'monospace'`    | Font family for character particles.                                                              |
| `videoUpdateRate`   | number   | `100`            | Milliseconds between frame updates for real-time video support.                                   |
| `on.init`           | function | `—`              | Callback that runs once the particle system is ready. Receives the instance as an argument.       |

> The `target` parameter is required; all others are optional.

---

## Presets

Below are some ready-made configurations for different effects:

| Name        | Settings                                                                                                         | Purpose                           |
| ----------- | ---------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| **Subtle**  | `{ character: '•', particleSize: 0.01, displaceStrength: 0.3, displaceRadius: 0.05 }`                            | Minimal, elegant particle effect. |
| **Dynamic** | `{ character: '✨', particleSize: 0.025, displaceStrength: 1.2, displaceRadius: 0.2, tilt: true }`               | High-energy effect with tilt.     |
| **Organic** | `{ character: '◦', particleSize: 0.008, displaceStrength: 0.8, velocityInfluence: 0.6 }`                         | Natural, flowing movement.        |
| **Retro**   | `{ character: '█', particleSize: 0.02, particleColour: '#00ff00', fontFamily: 'monospace' }`                     | Pixel-art style effect.           |
| **Fire**    | `{ character: '🔥', particleSize: 0.03, displaceStrength: 1.5, displaceRadius: 0.15, particleColour: 'sample' }` | Flame-like particle movement.     |

---

## FAQ

| Question                                               | Answer                                                                                                                                                                                                                                                       |
| :----------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Does the library handle responsive design?             | Yes, `particlesGL` automatically handles window resize events and rebuilds particle systems as needed. Resize handling is debounced for performance.                                                                                                         |
| What happens to the original element?                  | The original element is hidden (`visibility: hidden`) and replaced with the particle system. The particle system is inserted into the DOM and precisely matches the original element's position and dimensions.                                              |
| Can I use custom fonts for character particles?        | Yes, use the `fontFamily` parameter to specify any loaded font. Make sure the font is loaded before you initialise `particlesGL`.                                                                                                                            |
| How do I optimise performance for many particles?      | Increase the `sampling` value to reduce particle count, use a smaller `particleSize`, and limit the number of simultaneous instances. The library also helps by automatically pausing rendering for particle systems that are off-screen (viewport culling). |
| Can I update particle properties after initialisation? | Yes, use the `updateOptions()` method: `particleEffect.updateOptions({ particleColour: '#ff0000' })`. Some changes (like `character` or `sampling`) may require the particle system to be completely rebuilt, which the library handles automatically.       |
| Does the effect work on mobile devices?                | Yes, `particlesGL` works on most modern mobile devices that support WebGL. Interaction is based on touch-and-drag events, which mimic a mouse. Touch-specific interactions like multi-touch are not supported.                                               |
| What types of elements can be converted to particles?  | Images, SVGs, text, and videos. For other HTML elements (like a `<div>` or `<p>`), the library will convert their text content into particles.                                                                                                               |
| How does real-time video support work?                 | For video elements, particles are regenerated from the current video frame at the interval specified by `videoUpdateRate`. The effect only updates when the video is playing, providing a smooth, real-time animation that follows the video content.        |
| Are there any CORS issues with images?                 | Images from external domains may fail to load due to Cross-Origin Resource Sharing (CORS) policies. For best results, serve images from the same domain or ensure the remote server provides the correct `Access-Control-Allow-Origin` headers.              |

---

## Performance Notes

- **Particle Count**: Controlled by the `sampling` parameter. Lower values create more particles but require more processing power.
- **Mobile Performance**: The library is designed to be performant, but does not include mobile-specific optimisations. Performance on mobile devices will depend on the device's hardware and the complexity of the particle effect.
- **Memory Management**: Particle systems and their assets are automatically cleaned up and disposed of when `cleanup()` is called or the page is unloaded.
- **Shared WebGL Context**: All `particlesGL` instances share a single renderer to prevent WebGL context limits and improve overall performance.
- **Viewport Culling**: Particle systems outside the viewport are not rendered, saving CPU and GPU resources.

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
  particleColour: "#ff0000",
  displaceStrength: 1.0,
});

// Access the current options object
console.log(particleEffect.options);

// Clean up the effect and restore the original element
particleEffect.cleanup();
```

---

## Important Notes

- The library automatically handles element visibility, replacing the original element with the particle system.
- Multiple instances are supported and share a single WebGL context for optimal performance.
- Particle systems are automatically cleaned up when the page is unloaded or when `cleanup()` is called.
- For best performance, be mindful of the number of particle systems running simultaneously, especially on mobile devices.
- The velocity-based interaction system ensures effects only appear when the cursor is moving, creating natural and performant interactions.

---

## License

MIT © NaughtyDuk
