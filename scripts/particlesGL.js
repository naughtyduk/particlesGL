// particlesGL - Interactive WebGL Particle Effects Library
// Built with love by NaughtyDuk©

(function () {
  "use strict";

  /* --------------------------------------------------
   *  Global State Management
   * ------------------------------------------------*/
  let globalRenderer = null;
  let instanceCounter = 0;
  let activeInstances = new Map();
  let animationFrameId = null;
  let isAnimating = false;
  let resizeObserver = null;
  let resizeDebounceTimer = null;

  /* --------------------------------------------------
   *  Shared Renderer Architecture
   * ------------------------------------------------*/
  class ParticlesGLRenderer {
    constructor() {
      this.particleSystems = new Map();
      this.targetElements = new Map();
      this.renderers = new Map(); // Individual renderers for each element

      // Mouse tracking
      this.mouse = new THREE.Vector2();
      this.lastMousePos = new THREE.Vector2();
      this.mouseVelocity = new THREE.Vector2();

      // Bind events
      this.onMouseMove = this.onMouseMove.bind(this);

      document.addEventListener("mousemove", this.onMouseMove);
    }

    addParticleSystem(instanceId, particleSystem, targetElement, options) {
      // Create individual renderer, scene, and camera for each element
      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: "high-performance",
        alpha: true,
      });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setClearColor(0x000000, 0);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
      camera.position.z = 1.15;

      scene.add(particleSystem);

      // Append the canvas to the body once on creation
      const canvas = renderer.domElement;
      canvas.setAttribute("data-particles-target", instanceId);
      document.body.appendChild(canvas);

      this.renderers.set(instanceId, { renderer, scene, camera });

      this.particleSystems.set(instanceId, {
        system: particleSystem,
        element: targetElement,
        options: options,
        inView: false,
        observer: null,
        originalVisibility: targetElement.style.visibility,
        targetRotation: new THREE.Vector2(),
        isMouseOver: false,
        resetAnimation: { x: 0, y: 0 },
        currentMouse: new THREE.Vector2(),
        lastMousePos: new THREE.Vector2(),
        // Internal flag to prevent the animate loop from repositioning the canvas
        isFixedPosition: !!options._isModal,
        // Internal velocity-based effect control (not user-controllable)
        mouseVelocity: 0,
        isMoving: false,
        inactivityTimer: 0,
        effectRadius: 0,
        targetEffectRadius: 0,
        lastMoveTime: 0,
        // Real-time video support
        isVideo: targetElement.tagName.toLowerCase() === "video",
        videoCanvas: null,
        videoContext: null,
        lastVideoUpdate: 0,
        videoUpdateInterval: options.videoUpdateRate || 100,
      });

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
    }

    removeParticleSystem(instanceId, keepTargetHidden = false) {
      const systemData = this.particleSystems.get(instanceId);
      const rendererData = this.renderers.get(instanceId);

      if (systemData) {
        // Restore original target element visibility (unless we want to keep it hidden)
        if (!keepTargetHidden) {
          systemData.element.style.visibility =
            systemData.originalVisibility || "";
        }

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

        // Disconnect observer
        if (systemData.observer) {
          systemData.observer.disconnect();
        }

        // Clean up video canvas if exists
        if (systemData.videoCanvas) {
          systemData.videoCanvas = null;
          systemData.videoContext = null;
        }

        // Remove from maps
        this.particleSystems.delete(instanceId);
        this.targetElements.delete(instanceId);
      }

      // Dispose individual renderer
      if (rendererData) {
        if (rendererData.renderer) {
          rendererData.renderer.dispose();
        }
        this.renderers.delete(instanceId);
      }
    }

    onMouseMove(event) {
      // Check each particle system for mouse interaction
      for (const [instanceId, systemData] of this.particleSystems) {
        const rect = systemData.element.getBoundingClientRect();
        const isMouseOver =
          event.clientX >= rect.left &&
          event.clientX <= rect.right &&
          event.clientY >= rect.top &&
          event.clientY <= rect.bottom;

        // Handle mouse enter/leave for this specific system
        if (isMouseOver && !systemData.isMouseOver) {
          // Mouse entered this target
          systemData.isMouseOver = true;
        } else if (!isMouseOver && systemData.isMouseOver) {
          // Mouse left this target - start reset animation
          systemData.isMouseOver = false;
          this.startResetAnimation(instanceId);
        }

        // Update rotation and mouse position only for the hovered system
        if (isMouseOver) {
          const relativeX = event.clientX - rect.left;
          const relativeY = event.clientY - rect.top;

          const mouseX = (relativeX / rect.width) * 2 - 1;
          const mouseY = -(relativeY / rect.height) * 2 + 1;

          const newMousePos = new THREE.Vector2(mouseX, mouseY);

          // Calculate velocity for this system (simple approach)
          const velocity = newMousePos.clone().sub(systemData.currentMouse);
          systemData.mouseVelocity = velocity.length();

          // Record when mouse moved
          systemData.lastMoveTime = performance.now();

          // Update moving state based on velocity
          systemData.isMoving = systemData.mouseVelocity > 0.001;

          // Reset inactivity timer if moving
          if (systemData.isMoving) {
            systemData.inactivityTimer = 0;
          }

          // Apply tilt effect only if enabled
          if (systemData.options.tilt) {
            systemData.targetRotation.x =
              mouseY * systemData.options.tiltFactor;
            systemData.targetRotation.y =
              mouseX * systemData.options.tiltFactor;
          }

          // Store mouse position for glitch effect
          systemData.currentMouse.copy(newMousePos);
        }
      }
    }

    startResetAnimation(instanceId) {
      const systemData = this.particleSystems.get(instanceId);
      if (!systemData) return;

      // Animate back to center (0, 0) with easing
      systemData.resetAnimation.x = systemData.targetRotation.x;
      systemData.resetAnimation.y = systemData.targetRotation.y;

      const animate = () => {
        const easeSpeed = 0.08; // Adjust for faster/slower easing

        systemData.resetAnimation.x +=
          (0 - systemData.resetAnimation.x) * easeSpeed;
        systemData.resetAnimation.y +=
          (0 - systemData.resetAnimation.y) * easeSpeed;

        systemData.targetRotation.x = systemData.resetAnimation.x;
        systemData.targetRotation.y = systemData.resetAnimation.y;

        // Continue animation until close to center
        if (
          Math.abs(systemData.resetAnimation.x) > 0.001 ||
          Math.abs(systemData.resetAnimation.y) > 0.001
        ) {
          requestAnimationFrame(animate);
        } else {
          // Snap to exact center
          systemData.targetRotation.x = 0;
          systemData.targetRotation.y = 0;
          systemData.resetAnimation.x = 0;
          systemData.resetAnimation.y = 0;
        }
      };

      animate();
    }

    animate() {
      if (!isAnimating) return;

      // Update all particle systems
      for (const [instanceId, systemData] of this.particleSystems) {
        if (!systemData.inView) continue;

        const { system, options } = systemData;
        const rendererData = this.renderers.get(instanceId);

        if (!rendererData) continue;

        const { renderer, scene, camera } = rendererData;

        // Update movement state based on time since last move
        if (systemData.isMouseOver) {
          const currentTime = performance.now();
          const timeSinceLastMove = currentTime - systemData.lastMoveTime;

          // Consider stopped after 100ms of no mouse movement
          if (timeSinceLastMove > 100) {
            systemData.isMoving = false;
          }

          // Set target radius based on movement state
          systemData.targetEffectRadius = systemData.isMoving
            ? options.displaceRadius
            : 0;
        } else {
          systemData.targetEffectRadius = 0;
          systemData.isMoving = false;
        }

        // Ease effect radius towards target
        const easeSpeed = 0.08;
        const radiusDiff =
          systemData.targetEffectRadius - systemData.effectRadius;
        if (Math.abs(radiusDiff) > 0.001) {
          systemData.effectRadius += radiusDiff * easeSpeed;
        } else {
          systemData.effectRadius = systemData.targetEffectRadius;
        }

        // Update rotation using per-system rotation state
        if (system.rotation) {
          system.rotation.x +=
            (systemData.targetRotation.x - system.rotation.x) *
            options.tiltSpeed;
          system.rotation.y +=
            (systemData.targetRotation.y - system.rotation.y) *
            options.tiltSpeed;
        }

        // Update video-based particle systems
        if (systemData.isVideo) {
          this.updateVideoParticles(instanceId, systemData);
        }

        // Apply glitch effect with system-specific mouse position
        this.applyGlitchEffect(system, options, systemData);

        // Update renderer size and render for this element
        const rect = systemData.element.getBoundingClientRect();
        camera.aspect = rect.width / rect.height;
        camera.updateProjectionMatrix();
        renderer.setSize(rect.width, rect.height);

        // For standard elements, position the canvas to match the target element exactly.
        // For fixed elements (like modals), this step is skipped.
        if (!systemData.isFixedPosition) {
          const canvas = renderer.domElement;
          canvas.style.position = "absolute";
          canvas.style.top = rect.top + window.scrollY + "px";
          canvas.style.left = rect.left + window.scrollX + "px";
          canvas.style.width = rect.width + "px";
          canvas.style.height = rect.height + "px";
          canvas.style.zIndex = "10";
          canvas.style.pointerEvents = "none";
        }

        renderer.render(scene, camera);
      }

      animationFrameId = requestAnimationFrame(() => this.animate());
    }

    applyGlitchEffect(particleSystem, options, systemData) {
      if (!particleSystem || !particleSystem.geometry) return;

      const posAttr = particleSystem.geometry.attributes.position;
      const originalPosAttr =
        particleSystem.geometry.attributes.originalPosition;

      if (!posAttr || !originalPosAttr) return;

      // Use dynamic effect radius instead of fixed displaceRadius
      const currentRadius = systemData.effectRadius;

      // If radius is essentially zero, just return particles to original positions
      if (currentRadius < 0.001) {
        const positions = posAttr.array;
        const originalPositions = originalPosAttr.array;

        for (let i = 0; i < positions.length; i += 3) {
          const lerpFactor = options.returnSpeed;
          positions[i] += (originalPositions[i] - positions[i]) * lerpFactor;
          positions[i + 1] +=
            (originalPositions[i + 1] - positions[i + 1]) * lerpFactor;
        }

        posAttr.needsUpdate = true;
        return;
      }

      const positions = posAttr.array;
      const originalPositions = originalPosAttr.array;

      // Use stored mouse position for this specific system
      const currentMouse = systemData.currentMouse;
      const mouseVelocity = currentMouse.clone().sub(systemData.lastMousePos);
      systemData.lastMousePos.copy(currentMouse);

      const mouseWorld = new THREE.Vector2(
        currentMouse.x * 1.5,
        currentMouse.y * 1.5
      );
      const velocityAngle = Math.atan2(mouseVelocity.y, mouseVelocity.x);

      for (let i = 0; i < positions.length; i += 3) {
        const tempVec = new THREE.Vector2(positions[i], positions[i + 1]);
        const distanceToMouse = mouseWorld.distanceTo(tempVec);

        if (distanceToMouse > currentRadius * 2) {
          const lerpFactor = options.returnSpeed;
          positions[i] += (originalPositions[i] - positions[i]) * lerpFactor;
          positions[i + 1] +=
            (originalPositions[i + 1] - positions[i + 1]) * lerpFactor;
          continue;
        }

        const normalizedDist = distanceToMouse / currentRadius;
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
            falloff * options.displaceStrength * (1 + Math.random() * 0.5);

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

    updateVideoParticles(instanceId, systemData) {
      const currentTime = performance.now();

      // Check if enough time has passed since last video update
      if (
        currentTime - systemData.lastVideoUpdate <
        systemData.videoUpdateInterval
      ) {
        return;
      }

      const videoElement = systemData.element;

      // Check if video is playing and has new frame data
      if (
        videoElement.readyState >= 2 &&
        !videoElement.paused &&
        !videoElement.ended
      ) {
        // Initialize video canvas if not exists
        if (!systemData.videoCanvas) {
          systemData.videoCanvas = document.createElement("canvas");
          systemData.videoCanvas.width = 2048;
          systemData.videoCanvas.height = 1024;
          systemData.videoContext = systemData.videoCanvas.getContext("2d", {
            willReadFrequently: true,
          });
        }

        // Draw current video frame to canvas
        systemData.videoContext.clearRect(0, 0, 2048, 1024);
        systemData.videoContext.drawImage(videoElement, 0, 0, 2048, 1024);

        // Get image data from current frame
        const imageData = systemData.videoContext.getImageData(
          0,
          0,
          2048,
          1024
        );

        // Generate new particle positions based on current frame brightness
        const newPositions = [];
        const newColors = [];
        const brightnessThreshold = 80; // Brightness threshold for particle detection
        const useColorSampling = systemData.options.particleColor === "sample";

        for (let y = 0; y < 1024; y += systemData.options.sampling) {
          for (let x = 0; x < 2048; x += systemData.options.sampling) {
            const i = (y * 2048 + x) * 4;
            const r = imageData.data[i];
            const g = imageData.data[i + 1];
            const b = imageData.data[i + 2];

            // Calculate luminance (brightness) - weighted for human eye perception
            const brightness = r * 0.299 + g * 0.587 + b * 0.114;

            // Check if pixel has significant color content (not just black/dark)
            const maxColorComponent = Math.max(r, g, b);
            const hasSignificantColor = maxColorComponent > 50; // Lower threshold for more inclusive detection

            if (brightness > brightnessThreshold && hasSignificantColor) {
              const xPos = (x - 1024) * systemData.options.particleSpacing;
              const yPos = (512 - y) * systemData.options.particleSpacing;
              newPositions.push(xPos, yPos, 0);

              // Sample color if enabled
              if (useColorSampling) {
                const colorR = r / 255;
                const colorG = g / 255;
                const colorB = b / 255;
                newColors.push(colorR, colorG, colorB);
              }
            }
          }
        }

        // Update particle system geometry with new positions
        const geometry = systemData.system.geometry;
        const positionAttr = geometry.attributes.position;
        const originalPositionAttr = geometry.attributes.originalPosition;

        if (newPositions.length > 0) {
          // Update position arrays
          positionAttr.array = new Float32Array(newPositions);
          originalPositionAttr.array = new Float32Array(newPositions);

          // Update geometry
          geometry.setAttribute(
            "position",
            new THREE.Float32BufferAttribute(newPositions, 3)
          );
          geometry.setAttribute(
            "originalPosition",
            new THREE.Float32BufferAttribute(newPositions, 3)
          );

          // Update color arrays if sampling is enabled
          if (useColorSampling && newColors.length > 0) {
            const colorAttr = geometry.attributes.color;
            const originalColorAttr = geometry.attributes.originalColor;

            if (colorAttr) {
              colorAttr.array = new Float32Array(newColors);
              originalColorAttr.array = new Float32Array(newColors);

              geometry.setAttribute(
                "color",
                new THREE.Float32BufferAttribute(newColors, 3)
              );
              geometry.setAttribute(
                "originalColor",
                new THREE.Float32BufferAttribute(newColors, 3)
              );

              colorAttr.needsUpdate = true;
              originalColorAttr.needsUpdate = true;
            }
          }

          positionAttr.needsUpdate = true;
          originalPositionAttr.needsUpdate = true;
        }

        systemData.lastVideoUpdate = currentTime;
      }
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

      // Dispose all renderers
      for (const [instanceId, rendererData] of this.renderers) {
        if (rendererData.renderer) {
          rendererData.renderer.dispose();
        }
      }

      // Clear references
      this.particleSystems.clear();
      this.targetElements.clear();
      this.renderers.clear();
    }
  }

  /* --------------------------------------------------
   *  Universal Element to Canvas Converter
   * ------------------------------------------------*/
  async function elementToCanvas(element, options = {}) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    // Set canvas size - use fixed dimensions that work well
    const canvasWidth = 2048;
    const canvasHeight = 1024;

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    try {
      switch (element.tagName.toLowerCase()) {
        case "img":
          await new Promise((resolve, reject) => {
            if (element.complete) {
              ctx.drawImage(element, 0, 0, canvasWidth, canvasHeight);
              resolve();
            } else {
              element.onload = () => {
                ctx.drawImage(element, 0, 0, canvasWidth, canvasHeight);
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
              ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
              URL.revokeObjectURL(svgUrl);
              resolve();
            };
            img.onerror = reject;
            img.src = svgUrl;
          });
          break;

        case "canvas":
          ctx.drawImage(element, 0, 0, canvasWidth, canvasHeight);
          break;

        case "video":
          if (element.readyState >= 2) {
            ctx.drawImage(element, 0, 0, canvasWidth, canvasHeight);
          } else {
            await new Promise((resolve) => {
              element.addEventListener(
                "loadeddata",
                () => {
                  ctx.drawImage(element, 0, 0, canvasWidth, canvasHeight);
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
              width: canvasWidth,
              height: canvasHeight,
              scale: 1,
            });
            ctx.drawImage(html2canvasResult, 0, 0, canvasWidth, canvasHeight);
          } else {
            // Fallback: render text content using particleColor
            ctx.fillStyle = options.particleColor || "#8c8c8c";
            ctx.font = `${options.fontSize || 48}px ${
              options.fontFamily || "Arial"
            }`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(
              element.textContent || element.innerText || "Text",
              canvasWidth / 2,
              canvasHeight / 2
            );
          }
          break;
      }
    } catch (error) {
      console.error("Error converting element to canvas:", error);
      // Fallback: create a simple shape
      ctx.fillStyle = "#333333";
      ctx.fillRect(
        canvasWidth / 4,
        canvasHeight / 4,
        canvasWidth / 2,
        canvasHeight / 2
      );
    }

    return canvas;
  }

  /* --------------------------------------------------
   *  Particle System Creation
   * ------------------------------------------------*/
  function createCharacterSprite(character, options, useColorSampling = false) {
    const canvas = document.createElement("canvas");
    const size = 64;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");

    // Use white for color sampling so vertex colors show through
    ctx.fillStyle = useColorSampling
      ? "#ffffff"
      : options.particleColor || "#8c8c8c";
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
    const colors = [];
    const originalColors = [];

    // Check if color sampling is enabled
    const useColorSampling = options.particleColor === "sample";

    // Check if element is a video for different threshold logic
    const isVideo = element.tagName.toLowerCase() === "video";
    const alphaThreshold = 128;
    const brightnessThreshold = 80;

    // Sample pixels to create particles
    for (let y = 0; y < canvas.height; y += options.sampling) {
      for (let x = 0; x < canvas.width; x += options.sampling) {
        const i = (y * canvas.width + x) * 4;
        const r = imageData.data[i];
        const g = imageData.data[i + 1];
        const b = imageData.data[i + 2];
        const alpha = imageData.data[i + 3];

        let shouldCreateParticle = false;

        if (isVideo) {
          // For video: use brightness and significant color detection
          const brightness = r * 0.299 + g * 0.587 + b * 0.114;

          // Check if pixel has significant color content (not just black/dark)
          const maxColorComponent = Math.max(r, g, b);
          const hasSignificantColor = maxColorComponent > 50; // Lower threshold for more inclusive detection

          shouldCreateParticle =
            brightness > brightnessThreshold && hasSignificantColor;
        } else {
          // For images/SVGs: use alpha threshold
          shouldCreateParticle = alpha > alphaThreshold;
        }

        if (shouldCreateParticle) {
          const xPos = (x - canvas.width / 2) * options.particleSpacing;
          const yPos = (canvas.height / 2 - y) * options.particleSpacing;
          positions.push(xPos, yPos, 0);
          originalPositions.push(xPos, yPos, 0);

          // Sample color if enabled
          if (useColorSampling) {
            const colorR = r / 255;
            const colorG = g / 255;
            const colorB = b / 255;
            colors.push(colorR, colorG, colorB);
            originalColors.push(colorR, colorG, colorB);
          }
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

    // Add color attributes if sampling is enabled
    if (useColorSampling) {
      geometry.setAttribute(
        "color",
        new THREE.Float32BufferAttribute(colors, 3)
      );
      geometry.setAttribute(
        "originalColor",
        new THREE.Float32BufferAttribute(originalColors, 3)
      );
    }

    const material = new THREE.PointsMaterial({
      size: options.particleSize,
      map: createCharacterSprite(options.character, options, useColorSampling),
      transparent: true,
      alphaTest: 0.5,
      sizeAttenuation: true,
      vertexColors: useColorSampling,
    });

    const particleSystem = new THREE.Points(geometry, material);
    particleSystem.userData = { options, useColorSampling };

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
        setupGlobalResizeObserver();
      }

      // Create particle systems for each target element
      for (let i = 0; i < this.elements.length; i++) {
        const element = this.elements[i];
        try {
          const particleSystem = await createParticleSystem(
            element,
            this.options
          );
          // Generate unique ID for each element
          const elementId = element.id || `element-${i}`;
          globalRenderer.addParticleSystem(
            this.id + "-" + elementId,
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

    cleanup(keepTargetHidden = false) {
      if (!this.initialized) return;

      // Remove all particle systems for this instance
      for (let i = 0; i < this.elements.length; i++) {
        const element = this.elements[i];
        const elementId = element.id || `element-${i}`;
        globalRenderer.removeParticleSystem(
          this.id + "-" + elementId,
          keepTargetHidden
        );
      }

      activeInstances.delete(this.id);

      // Clean up global renderer if no instances remain
      if (activeInstances.size === 0 && globalRenderer) {
        globalRenderer.dispose();
        globalRenderer = null;
        cleanupGlobalResizeObserver();
      }

      this.initialized = false;
    }

    updateOptions(newOptions) {
      const oldOptions = { ...this.options };
      this.options = { ...this.options, ...newOptions };

      // Check if we need to reinitialize (geometry/texture changes)
      const needsReinit = [
        "character",
        "sampling",
        "particleSpacing",
        "fontSize",
        "fontFamily",
        "target",
      ].some(
        (key) =>
          newOptions[key] !== undefined && newOptions[key] !== oldOptions[key]
      );

      if (needsReinit) {
        // Hard reinit for major changes
        this.cleanup();
        setTimeout(() => this.init(), 100);
      } else {
        // Update properties in real-time
        this.updateLiveProperties(newOptions);
      }
    }

    updateLiveProperties(newOptions) {
      if (!globalRenderer) return;

      // Update renderer properties for all instances of this particle system
      for (let i = 0; i < this.elements.length; i++) {
        const element = this.elements[i];
        const elementId = element.id || `element-${i}`;
        const instanceId = this.id + "-" + elementId;
        const systemData = globalRenderer.particleSystems.get(instanceId);

        if (systemData) {
          // Update system options
          systemData.options = { ...systemData.options, ...newOptions };

          // Update material properties
          const material = systemData.system.material;
          if (material) {
            if (newOptions.particleSize !== undefined) {
              material.size = newOptions.particleSize;
            }
            if (newOptions.particleColor !== undefined) {
              const useColorSampling = newOptions.particleColor === "sample";
              const wasColorSampling = systemData.useColorSampling;

              // Update character sprite with new color
              const oldMap = material.map;
              material.map = createCharacterSprite(
                this.options.character,
                this.options,
                useColorSampling
              );
              if (oldMap) oldMap.dispose(); // Clean up old texture

              // Update vertex colors setting
              material.vertexColors = useColorSampling;

              // Update userData
              systemData.system.userData.useColorSampling = useColorSampling;
              systemData.useColorSampling = useColorSampling;

              // If switching color sampling mode, mark material as needing update
              if (useColorSampling !== wasColorSampling) {
                material.needsUpdate = true;
              }
            }
          }
        }
      }
    }

    createCharacterSprite(character, options, useColorSampling = false) {
      const canvas = document.createElement("canvas");
      const size = 64;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");

      // Use white for color sampling so vertex colors show through
      ctx.fillStyle = useColorSampling
        ? "#ffffff"
        : options.particleColor || "#8c8c8c";
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
  }

  /* --------------------------------------------------
   *  Global Resize Observer
   * ------------------------------------------------*/
  function setupGlobalResizeObserver() {
    if (resizeObserver) return; // Already setup

    const handleResize = () => {
      // Clear existing timer
      if (resizeDebounceTimer) {
        clearTimeout(resizeDebounceTimer);
      }

      // Set new timer with 250ms debounce
      resizeDebounceTimer = setTimeout(() => {
        console.log("particlesGL: Browser resized, reinitializing effects...");

        // Reinitialize all active instances
        for (const [, instance] of activeInstances) {
          if (instance && instance.initialized) {
            instance.cleanup(true); // Keep target hidden during resize reinit
            setTimeout(() => {
              instance.init();
            }, 50);
          }
        }
      }, 250);
    };

    // Setup resize observer
    window.addEventListener("resize", handleResize);
    resizeObserver = handleResize;
  }

  function cleanupGlobalResizeObserver() {
    if (resizeObserver) {
      window.removeEventListener("resize", resizeObserver);
      resizeObserver = null;
    }

    if (resizeDebounceTimer) {
      clearTimeout(resizeDebounceTimer);
      resizeDebounceTimer = null;
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
      sampling: 4,
      tilt: false,
      tiltFactor: 0.2,
      tiltSpeed: 0.05,
      displaceStrength: 0.6,
      displaceRadius: 0.1,
      velocityInfluence: 0.3,
      returnSpeed: 0.05,
      fontSize: 48,
      fontFamily: "monospace",
      videoUpdateRate: 100, // ms between video frame updates
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
