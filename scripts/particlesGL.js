// Init ASCII
const ASCIIEffect = (function () {
  let scene = null;
  let camera = null;
  let renderer = null;
  let particleSystem = null;
  const mouse = new THREE.Vector2();
  const targetRotation = new THREE.Vector2();
  const lastMousePos = new THREE.Vector2();
  const mouseVelocity = new THREE.Vector2();

  let cachedFooter = null;
  let cachedArrowSprite = null;

  const tempVec = new THREE.Vector2();
  const mouseWorld = new THREE.Vector2();
  const finalAngleVec = new THREE.Vector2();

  let initialized = false;
  let animationFrameId = null;
  let mouseMoveListener = null;
  let resizeListener = null;
  let visibilityObserver = null;
  let inView = false;

  // Global flag to prevent multiple instances
  if (window.ASCIIEffectInitialized) {
    console.warn("ASCIIEffect already initialized globally, skipping...");
    return { init: () => {}, cleanup: () => {} };
  }

  function getFooterElement() {
    if (!cachedFooter) {
      cachedFooter = document.getElementById("ascii-logo-insert");
    }
    return cachedFooter;
  }

  function createArrowSprite() {
    if (cachedArrowSprite) return cachedArrowSprite;
    const canvas = document.createElement("canvas");
    const size = 64;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#8c8c8c";
    ctx.font = "48px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    // Temporarily use a simple dot to test if the arrow character is causing duplication
    ctx.fillText("â€¢", size / 2, size / 2);

    cachedArrowSprite = new THREE.CanvasTexture(canvas);
    cachedArrowSprite.minFilter = THREE.LinearFilter;
    cachedArrowSprite.magFilter = THREE.LinearFilter;
    return cachedArrowSprite;
  }

  function createASCIILogo() {
    // Check if particleSystem already exists
    if (particleSystem) {
      console.warn("Particle system already exists! Removing old one...");
      scene.remove(particleSystem);
      if (particleSystem.geometry) particleSystem.geometry.dispose();
      if (particleSystem.material) {
        if (particleSystem.material.map) particleSystem.material.map.dispose();
        particleSystem.material.dispose();
      }
      particleSystem = null;
    }

    const loader = new THREE.TextureLoader();
    loader.load(
      "https://cdn.prod.website-files.com/67a24e2b6033739482dbe9cd/67a3d1a10eb7305c70724387_logo.svg",
      (texture) => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        canvas.width = 2048;
        canvas.height = 1024;

        ctx.drawImage(texture.image, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        const positions = [];
        const originalPositions = [];
        const stepSize = 4;

        for (let y = 0; y < canvas.height; y += stepSize) {
          for (let x = 0; x < canvas.width; x += stepSize) {
            const i = (y * canvas.width + x) * 4;
            const alpha = imageData.data[i + 3];
            if (alpha > 128) {
              const xPos = (x - canvas.width / 2) * 0.002;
              const yPos = (canvas.height / 2 - y) * 0.002;
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
          size: 0.015,
          map: createArrowSprite(),
          transparent: true,
          alphaTest: 0.5,
          sizeAttenuation: true,
        });

        particleSystem = new THREE.Points(geometry, material);
        scene.add(particleSystem);
      }
    );
  }

  function setupScene() {
    camera.position.z = 1.15;
    scene.background = new THREE.Color(0xeaeaec);
    createASCIILogo();

    mouse.set(0, -0.2);
    targetRotation.set(mouse.y * 0.2, mouse.x * 0.2);

    if (particleSystem) {
      particleSystem.rotation.x = targetRotation.x;
      particleSystem.rotation.y = targetRotation.y;
    }
  }

  function onMouseMove(event) {
    const footerElement = getFooterElement();
    if (!footerElement) return;
    const { left, top, right, bottom, width, height } =
      footerElement.getBoundingClientRect();

    if (
      event.clientX < left ||
      event.clientX > right ||
      event.clientY < top ||
      event.clientY > bottom
    ) {
      return;
    }

    const relativeX = event.clientX - left;
    const relativeY = event.clientY - top;

    mouse.x = (relativeX / width) * 2 - 1;
    mouse.y = -(relativeY / height) * 2 + 1;

    targetRotation.x = mouse.y * 0.2;
    targetRotation.y = mouse.x * 0.2;
  }

  function glitchEffect() {
    if (!particleSystem) return;

    const posAttr = particleSystem.geometry.attributes.position;
    const positions = posAttr.array;
    const originalPositions =
      particleSystem.geometry.attributes.originalPosition.array;

    mouseVelocity.copy(mouse).sub(lastMousePos);
    lastMousePos.copy(mouse);
    mouseWorld.set(mouse.x * 1.5, mouse.y * 1.5);

    const velocityAngle = Math.atan2(mouseVelocity.y, mouseVelocity.x);
    const displacementRadius = 0.1;
    const displacementStrength = 0.6;
    const velocityInfluence = 0.1;

    const len = positions.length;
    for (let i = 0; i < len; i += 3) {
      tempVec.set(positions[i], positions[i + 1]);
      const distanceToMouse = mouseWorld.distanceTo(tempVec);

      if (distanceToMouse > displacementRadius * 2) {
        const lerpFactor = 0.05;
        positions[i] += (originalPositions[i] - positions[i]) * lerpFactor;
        positions[i + 1] +=
          (originalPositions[i + 1] - positions[i + 1]) * lerpFactor;
        continue;
      }

      const normalizedDist = distanceToMouse / displacementRadius;
      const falloff = Math.exp(-normalizedDist * normalizedDist * 2);

      if (falloff > 0.01) {
        const baseAngle = Math.atan2(
          tempVec.y - mouseWorld.y,
          tempVec.x - mouseWorld.x
        );
        const finalAngle = baseAngle + velocityAngle * velocityInfluence;
        const randomAngle = (Math.random() - 0.5) * Math.PI * 0.5;
        const strength =
          falloff * displacementStrength * (1 + Math.random() * 0.5);

        finalAngleVec.set(
          Math.cos(finalAngle + randomAngle) * strength,
          Math.sin(finalAngle + randomAngle) * strength
        );

        positions[i] = originalPositions[i] + finalAngleVec.x;
        positions[i + 1] = originalPositions[i + 1] + finalAngleVec.y;
      } else {
        positions[i] += (originalPositions[i] - positions[i]) * 0.05;
        positions[i + 1] +=
          (originalPositions[i + 1] - positions[i + 1]) * 0.05;
      }
    }

    posAttr.needsUpdate = true;
  }

  function animate() {
    animationFrameId = null; // will be reset by startAnimation if needed

    if (!inView) return; // Skip if not visible

    // Schedule next frame
    startAnimation();

    if (particleSystem) {
      particleSystem.rotation.x +=
        (targetRotation.x - particleSystem.rotation.x) * 0.05;
      particleSystem.rotation.y +=
        (targetRotation.y - particleSystem.rotation.y) * 0.05;
      glitchEffect();
    }

    renderer.render(scene, camera);
  }

  function startAnimation() {
    if (animationFrameId === null && inView) {
      animationFrameId = requestAnimationFrame(animate);
    } else if (animationFrameId !== null) {
      // Debug: Check for multiple animation loops
      console.warn(
        "ASCII animation already running - preventing duplicate loop"
      );
    }
  }

  function stopAnimation() {
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  }

  function onResize() {
    const footerElement = getFooterElement();
    if (!footerElement) return;
    const width = footerElement.clientWidth;
    const height = footerElement.clientHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }

  function init() {
    // Check if already initialized
    if (initialized) {
      cleanup(); // Clean up previous instance first
    }

    cachedFooter = document.getElementById("ascii-logo-insert");
    if (!cachedFooter) {
      console.error("Footer element not found");
      return;
    }

    // IMPORTANT: Remove any existing canvases to prevent double rendering
    const existingCanvases = cachedFooter.querySelectorAll("canvas");
    existingCanvases.forEach((canvas) => {
      canvas.remove();
    });

    // Create new Three.js objects each time
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(
      75,
      cachedFooter.clientWidth / cachedFooter.clientHeight,
      0.1,
      1000
    );

    renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(cachedFooter.clientWidth, cachedFooter.clientHeight);

    cachedFooter.appendChild(renderer.domElement);

    setupScene();

    // Store reference to bound event listeners for later removal
    mouseMoveListener = onMouseMove;
    resizeListener = onResize;

    document.addEventListener("mousemove", mouseMoveListener);
    window.addEventListener("resize", resizeListener);

    // Setup IntersectionObserver to pause / resume when footer enters viewport
    if ("IntersectionObserver" in window) {
      visibilityObserver = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            inView = true;
            startAnimation();
          } else {
            inView = false;
            stopAnimation();
          }
        },
        { root: null, threshold: 0 }
      );
      visibilityObserver.observe(cachedFooter);
    } else {
      // Fallback: assume always in view
      inView = true;
      startAnimation();
    }

    initialized = true;
    window.ASCIIEffectInitialized = true;
  }

  function cleanup() {
    if (!initialized) return;

    // Remove event listeners
    document.removeEventListener("mousemove", mouseMoveListener);
    window.removeEventListener("resize", resizeListener);

    // Dispose materials and geometries
    if (particleSystem) {
      if (particleSystem.geometry) particleSystem.geometry.dispose();
      if (particleSystem.material) {
        if (particleSystem.material.map) particleSystem.material.map.dispose();
        particleSystem.material.dispose();
      }
      scene.remove(particleSystem);
      particleSystem = null;
    }

    // Dispose cached textures
    if (cachedArrowSprite) {
      cachedArrowSprite.dispose();
      cachedArrowSprite = null;
    }

    // Clear the scene
    if (scene) {
      scene.clear();
      scene = null;
    }

    // Important: dispose the renderer to free WebGL context
    if (renderer) {
      if (renderer.domElement) {
        // Remove the canvas from DOM
        if (renderer.domElement.parentNode) {
          renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
      }
      renderer.dispose();
      renderer = null;
    }

    // Reset Three.js cache (very important for WebGL contexts)
    if (THREE.Cache) {
      THREE.Cache.clear();
    }

    // Reset other variables
    camera = null;
    cachedFooter = null;
    mouseMoveListener = null;
    resizeListener = null;
    inView = false;
    stopAnimation();

    if (visibilityObserver) {
      visibilityObserver.disconnect();
      visibilityObserver = null;
    }

    initialized = false;
    window.ASCIIEffectInitialized = false;
  }

  return { init, cleanup };
})();

// Export ASCIIEffect for external initialization
window.ASCIIEffect = ASCIIEffect;
