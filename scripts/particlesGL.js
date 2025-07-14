// particlesGL - Interactive WebGL Particle Effects Library
// Built with love by NaughtyDuk©

(function () {
  "use strict";

  /* --------------------------------------------------
   *  Global State Management
   * ------------------------------------------------*/
  let globalRenderer = null;
  let globalScene = null;
  let globalCamera = null;
  let instanceCounter = 0;
  let activeInstances = new Map();
  let animationFrameId = null;
  let isAnimating = false;

  /* --------------------------------------------------
   *  Shared Renderer Architecture
   * ------------------------------------------------*/
  class ParticlesGLRenderer {
    constructor() {
      this.renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: "high-performance",
        alpha: true,
      });
      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
      this.camera.position.z = 1.15;
      this.particleSystems = new Map();
      this.targetElements = new Map();

      // Setup renderer
      this.renderer.setPixelRatio(window.devicePixelRatio);
      this.renderer.setClearColor(0x000000, 0);

      // Mouse tracking
      this.mouse = new THREE.Vector2();
      this.targetRotation = new THREE.Vector2();
      this.lastMousePos = new THREE.Vector2();
      this.mouseVelocity = new THREE.Vector2();
      this.isMouseOverTarget = false;
      this.resetAnimation = { x: 0, y: 0 };

      // Bind events
      this.onMouseMove = this.onMouseMove.bind(this);
      this.onResize = this.onResize.bind(this);

      document.addEventListener("mousemove", this.onMouseMove);
      window.addEventListener("resize", this.onResize);
    }

    addParticleSystem(instanceId, particleSystem, targetElement, options) {
      this.particleSystems.set(instanceId, {
        system: particleSystem,
        element: targetElement,
        options: options,
        inView: false,
        observer: null,
        originalVisibility: targetElement.style.visibility,
      });

      this.scene.add(particleSystem);
      this.targetElements.set(instanceId, targetElement);

      // Hide the original target element once particles are created
      targetElement.style.visibility = "hidden";

      // Setup viewport visibility observer
      if ("IntersectionObserver" in window) {
        const observer = new IntersectionObserver(
          (entries) => {
            const systemData = this.particleSystems.get(instanceId);
            if (systemData) {
              systemData.inView = entries[0].isIntersecting;
            }
          },
          { root: null, threshold: 0 }
        );

        observer.observe(targetElement);
        this.particleSystems.get(instanceId).observer = observer;
      } else {
        this.particleSystems.get(instanceId).inView = true;
      }

      this.updateRendererSize();
    }

    removeParticleSystem(instanceId) {
      const systemData = this.particleSystems.get(instanceId);
      if (systemData) {
        // Restore original target element visibility
        systemData.element.style.visibility =
          systemData.originalVisibility || "";

        // Remove canvas from DOM
        const canvas = document.querySelector(
          `canvas[data-particles-target="${instanceId}"]`
        );
        if (canvas) {
          canvas.remove();
        }

        // Dispose resources
        if (systemData.system.geometry) systemData.system.geometry.dispose();
        if (systemData.system.material) {
          if (systemData.system.material.map)
            systemData.system.material.map.dispose();
          systemData.system.material.dispose();
        }

        // Remove from scene
        this.scene.remove(systemData.system);

        // Disconnect observer
        if (systemData.observer) {
          systemData.observer.disconnect();
        }

        // Remove from maps
        this.particleSystems.delete(instanceId);
        this.targetElements.delete(instanceId);
      }
    }

    onMouseMove(event) {
      // Find which element the mouse is over
      let activeSystem = null;
      let activeOptions = null;
      let mouseOverAnyTarget = false;

      for (const [instanceId, systemData] of this.particleSystems) {
        const rect = systemData.element.getBoundingClientRect();
        if (
          event.clientX >= rect.left &&
          event.clientX <= rect.right &&
          event.clientY >= rect.top &&
          event.clientY <= rect.bottom
        ) {
          activeSystem = systemData.system;
          activeOptions = systemData.options;
          mouseOverAnyTarget = true;

          const relativeX = event.clientX - rect.left;
          const relativeY = event.clientY - rect.top;

          this.mouse.x = (relativeX / rect.width) * 2 - 1;
          this.mouse.y = -(relativeY / rect.height) * 2 + 1;
          break;
        }
      }

      // Handle mouse enter/leave
      if (mouseOverAnyTarget && !this.isMouseOverTarget) {
        // Mouse entered target
        this.isMouseOverTarget = true;
      } else if (!mouseOverAnyTarget && this.isMouseOverTarget) {
        // Mouse left target - start reset animation
        this.isMouseOverTarget = false;
        this.startResetAnimation();
      }

      // Update rotation only when mouse is over target
      if (mouseOverAnyTarget && activeOptions) {
        this.targetRotation.x =
          this.mouse.y * activeOptions.rotationSensitivity;
        this.targetRotation.y =
          this.mouse.x * activeOptions.rotationSensitivity;
      }
    }

    onResize() {
      this.updateRendererSize();
    }

    startResetAnimation() {
      // Animate back to center (0, 0) with easing
      this.resetAnimation.x = this.targetRotation.x;
      this.resetAnimation.y = this.targetRotation.y;

      const animate = () => {
        const easeSpeed = 0.08; // Adjust for faster/slower easing

        this.resetAnimation.x += (0 - this.resetAnimation.x) * easeSpeed;
        this.resetAnimation.y += (0 - this.resetAnimation.y) * easeSpeed;

        this.targetRotation.x = this.resetAnimation.x;
        this.targetRotation.y = this.resetAnimation.y;

        // Continue animation until close to center
        if (
          Math.abs(this.resetAnimation.x) > 0.001 ||
          Math.abs(this.resetAnimation.y) > 0.001
        ) {
          requestAnimationFrame(animate);
        } else {
          // Snap to exact center
          this.targetRotation.x = 0;
          this.targetRotation.y = 0;
          this.resetAnimation.x = 0;
          this.resetAnimation.y = 0;
        }
      };

      animate();
    }

    updateRendererSize() {
      // Update camera and renderer for the largest visible element
      let maxWidth = 0;
      let maxHeight = 0;

      for (const [instanceId, systemData] of this.particleSystems) {
        const rect = systemData.element.getBoundingClientRect();
        maxWidth = Math.max(maxWidth, rect.width);
        maxHeight = Math.max(maxHeight, rect.height);
      }

      if (maxWidth > 0 && maxHeight > 0) {
        this.camera.aspect = maxWidth / maxHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(maxWidth, maxHeight);
      }
    }

    animate() {
      if (!isAnimating) return;

      // Update all particle systems
      for (const [instanceId, systemData] of this.particleSystems) {
        if (!systemData.inView) continue;

        const { system, options } = systemData;

        // Update rotation
        if (system.rotation) {
          system.rotation.x +=
            (this.targetRotation.x - system.rotation.x) * options.rotationSpeed;
          system.rotation.y +=
            (this.targetRotation.y - system.rotation.y) * options.rotationSpeed;
        }

        // Apply glitch effect
        this.applyGlitchEffect(system, options);

        // Update renderer size and render for this element
        const rect = systemData.element.getBoundingClientRect();
        this.camera.aspect = rect.width / rect.height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(rect.width, rect.height);

        // Position canvas to match target element exactly
        const canvas = this.renderer.domElement;
        canvas.style.position = "absolute";
        canvas.style.top = rect.top + "px";
        canvas.style.left = rect.left + "px";
        canvas.style.width = rect.width + "px";
        canvas.style.height = rect.height + "px";
        canvas.style.zIndex = "10";
        canvas.style.pointerEvents = "none";

        // Clear previous canvas and append to document body
        const existingCanvas = document.querySelector(
          `canvas[data-particles-target="${instanceId}"]`
        );
        if (existingCanvas) {
          existingCanvas.remove();
        }

        canvas.setAttribute("data-particles-target", instanceId);
        document.body.appendChild(canvas);
        this.renderer.render(this.scene, this.camera);
      }

      animationFrameId = requestAnimationFrame(() => this.animate());
    }

    applyGlitchEffect(particleSystem, options) {
      if (!particleSystem || !particleSystem.geometry) return;

      const posAttr = particleSystem.geometry.attributes.position;
      const originalPosAttr =
        particleSystem.geometry.attributes.originalPosition;

      if (!posAttr || !originalPosAttr) return;

      const positions = posAttr.array;
      const originalPositions = originalPosAttr.array;

      this.mouseVelocity.copy(this.mouse).sub(this.lastMousePos);
      this.lastMousePos.copy(this.mouse);

      const mouseWorld = new THREE.Vector2(
        this.mouse.x * 1.5,
        this.mouse.y * 1.5
      );
      const velocityAngle = Math.atan2(
        this.mouseVelocity.y,
        this.mouseVelocity.x
      );

      for (let i = 0; i < positions.length; i += 3) {
        const tempVec = new THREE.Vector2(positions[i], positions[i + 1]);
        const distanceToMouse = mouseWorld.distanceTo(tempVec);

        if (distanceToMouse > options.glitchRadius * 2) {
          const lerpFactor = options.returnSpeed;
          positions[i] += (originalPositions[i] - positions[i]) * lerpFactor;
          positions[i + 1] +=
            (originalPositions[i + 1] - positions[i + 1]) * lerpFactor;
          continue;
        }

        const normalizedDist = distanceToMouse / options.glitchRadius;
        const falloff = Math.exp(-normalizedDist * normalizedDist * 2);

        if (falloff > 0.01) {
          const baseAngle = Math.atan2(
            tempVec.y - mouseWorld.y,
            tempVec.x - mouseWorld.x
          );
          const finalAngle =
            baseAngle + velocityAngle * options.velocityInfluence;
          const randomAngle = (Math.random() - 0.5) * Math.PI * 0.5;
          const strength =
            falloff * options.glitchStrength * (1 + Math.random() * 0.5);

          const displacement = new THREE.Vector2(
            Math.cos(finalAngle + randomAngle) * strength,
            Math.sin(finalAngle + randomAngle) * strength
          );

          positions[i] = originalPositions[i] + displacement.x;
          positions[i + 1] = originalPositions[i + 1] + displacement.y;
        } else {
          positions[i] +=
            (originalPositions[i] - positions[i]) * options.returnSpeed;
          positions[i + 1] +=
            (originalPositions[i + 1] - positions[i + 1]) * options.returnSpeed;
        }
      }

      posAttr.needsUpdate = true;
    }

    startAnimation() {
      if (!isAnimating) {
        isAnimating = true;
        this.animate();
      }
    }

    stopAnimation() {
      if (isAnimating) {
        isAnimating = false;
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
          animationFrameId = null;
        }
      }
    }

    dispose() {
      this.stopAnimation();

      // Clean up all particle systems
      for (const [instanceId] of this.particleSystems) {
        this.removeParticleSystem(instanceId);
      }

      // Remove event listeners
      document.removeEventListener("mousemove", this.onMouseMove);
      window.removeEventListener("resize", this.onResize);

      // Dispose renderer
      if (this.renderer) {
        this.renderer.dispose();
        this.renderer = null;
      }

      // Clear references
      this.scene = null;
      this.camera = null;
      this.particleSystems.clear();
      this.targetElements.clear();
    }
  }

  /* --------------------------------------------------
   *  Universal Element to Canvas Converter
   * ------------------------------------------------*/
  async function elementToCanvas(element, options = {}) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    // Set canvas size
    canvas.width = options.canvasWidth || 2048;
    canvas.height = options.canvasHeight || 1024;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    try {
      switch (element.tagName.toLowerCase()) {
        case "img":
          await new Promise((resolve, reject) => {
            if (element.complete) {
              ctx.drawImage(element, 0, 0, canvas.width, canvas.height);
              resolve();
            } else {
              element.onload = () => {
                ctx.drawImage(element, 0, 0, canvas.width, canvas.height);
                resolve();
              };
              element.onerror = reject;
            }
          });
          break;

        case "svg":
          // Convert SVG to image
          const svgData = new XMLSerializer().serializeToString(element);
          const svgBlob = new Blob([svgData], { type: "image/svg+xml" });
          const svgUrl = URL.createObjectURL(svgBlob);
          const img = new Image();

          await new Promise((resolve, reject) => {
            img.onload = () => {
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
              URL.revokeObjectURL(svgUrl);
              resolve();
            };
            img.onerror = reject;
            img.src = svgUrl;
          });
          break;

        case "canvas":
          ctx.drawImage(element, 0, 0, canvas.width, canvas.height);
          break;

        case "video":
          if (element.readyState >= 2) {
            ctx.drawImage(element, 0, 0, canvas.width, canvas.height);
          } else {
            await new Promise((resolve) => {
              element.addEventListener(
                "loadeddata",
                () => {
                  ctx.drawImage(element, 0, 0, canvas.width, canvas.height);
                  resolve();
                },
                { once: true }
              );
            });
          }
          break;

        default:
          // For other HTML elements, try to use html2canvas if available
          if (typeof html2canvas === "function") {
            const html2canvasResult = await html2canvas(element, {
              width: canvas.width,
              height: canvas.height,
              scale: 1,
            });
            ctx.drawImage(html2canvasResult, 0, 0, canvas.width, canvas.height);
          } else {
            // Fallback: render text content
            ctx.fillStyle = options.textColor || "#000000";
            ctx.font = options.fontSize || "48px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(
              element.textContent || element.innerText || "Text",
              canvas.width / 2,
              canvas.height / 2
            );
          }
          break;
      }
    } catch (error) {
      console.error("Error converting element to canvas:", error);
      // Fallback: create a simple shape
      ctx.fillStyle = "#333333";
      ctx.fillRect(
        canvas.width / 4,
        canvas.height / 4,
        canvas.width / 2,
        canvas.height / 2
      );
    }

    return canvas;
  }

  /* --------------------------------------------------
   *  Particle System Creation
   * ------------------------------------------------*/
  function createCharacterSprite(character, options) {
    const canvas = document.createElement("canvas");
    const size = 64;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = options.particleColor || "#8c8c8c";
    ctx.font = `${options.fontSize || 48}px ${
      options.fontFamily || "monospace"
    }`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(character, size / 2, size / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    return texture;
  }

  async function createParticleSystem(element, options) {
    const canvas = await elementToCanvas(element, options);
    const ctx = canvas.getContext("2d");
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    const positions = [];
    const originalPositions = [];

    // Sample pixels to create particles
    for (let y = 0; y < canvas.height; y += options.stepSize) {
      for (let x = 0; x < canvas.width; x += options.stepSize) {
        const i = (y * canvas.width + x) * 4;
        const alpha = imageData.data[i + 3];

        if (alpha > options.alphaThreshold) {
          const xPos = (x - canvas.width / 2) * options.particleSpacing;
          const yPos = (canvas.height / 2 - y) * options.particleSpacing;
          positions.push(xPos, yPos, 0);
          originalPositions.push(xPos, yPos, 0);
        }
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3)
    );
    geometry.setAttribute(
      "originalPosition",
      new THREE.Float32BufferAttribute(originalPositions, 3)
    );

    const material = new THREE.PointsMaterial({
      size: options.particleSize,
      map: createCharacterSprite(options.character, options),
      transparent: true,
      alphaTest: 0.5,
      sizeAttenuation: true,
    });

    const particleSystem = new THREE.Points(geometry, material);
    particleSystem.userData = { options };

    return particleSystem;
  }

  /* --------------------------------------------------
   *  Instance Management
   * ------------------------------------------------*/
  class ParticlesGLInstance {
    constructor(options, elements) {
      this.id = `particles-gl-${++instanceCounter}`;
      this.options = options;
      this.elements = elements;
      this.initialized = false;
    }

    async init() {
      if (this.initialized) return;

      // Initialize global renderer if needed
      if (!globalRenderer) {
        globalRenderer = new ParticlesGLRenderer();
        globalRenderer.startAnimation();
      }

      // Create particle systems for each target element
      for (const element of this.elements) {
        try {
          const particleSystem = await createParticleSystem(
            element,
            this.options
          );
          globalRenderer.addParticleSystem(
            this.id + "-" + element.id,
            particleSystem,
            element,
            this.options
          );
        } catch (error) {
          console.error(
            "particlesGL: Failed to create particle system for element:",
            element,
            error
          );
          // Element remains visible if particles fail to create
        }
      }

      this.initialized = true;
      activeInstances.set(this.id, this);

      // Call initialization callback
      if (this.options.on && this.options.on.init) {
        this.options.on.init(this);
      }
    }

    cleanup() {
      if (!this.initialized) return;

      // Remove all particle systems for this instance
      for (const element of this.elements) {
        globalRenderer.removeParticleSystem(this.id + "-" + element.id);
      }

      activeInstances.delete(this.id);

      // Clean up global renderer if no instances remain
      if (activeInstances.size === 0 && globalRenderer) {
        globalRenderer.dispose();
        globalRenderer = null;
      }

      this.initialized = false;
    }

    updateOptions(newOptions) {
      this.options = { ...this.options, ...newOptions };

      // Reinitialize with new options
      this.cleanup();
      setTimeout(() => this.init(), 100);
    }
  }

  /* --------------------------------------------------
   *  Public API
   * ------------------------------------------------*/
  window.particlesGL = function (userOptions = {}) {
    const defaults = {
      target: ".particlesGL",
      character: "•",
      particleSize: 0.015,
      particleSpacing: 0.002,
      particleColor: "#8c8c8c",
      stepSize: 4,
      alphaThreshold: 128,
      rotationSensitivity: 0.2,
      rotationSpeed: 0.05,
      glitchStrength: 0.6,
      glitchRadius: 0.1,
      velocityInfluence: 0.1,
      returnSpeed: 0.05,
      canvasWidth: 2048,
      canvasHeight: 1024,
      fontSize: 48,
      fontFamily: "monospace",
      textColor: "#000000",
      on: {},
    };

    const options = { ...defaults, ...userOptions };

    // Find target elements
    const elements = document.querySelectorAll(options.target);
    if (elements.length === 0) {
      console.error(
        `particlesGL: No elements found with selector "${options.target}"`
      );
      return null;
    }

    // Create instance
    const instance = new ParticlesGLInstance(options, Array.from(elements));

    // Auto-initialize
    instance.init();

    return {
      init: () => instance.init(),
      cleanup: () => instance.cleanup(),
      updateOptions: (newOptions) => instance.updateOptions(newOptions),
      options: instance.options,
    };
  };
})();
