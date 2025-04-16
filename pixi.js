function initPixiAnimation({
  containerId,
  frameCount,
  baseFilename,
  fps = 25,
  pad = 3,
  maxAttempts = 100,
  interval = 50,
}) {
  let attempts = 0;

  function tryStart() {
    const container = document.getElementById(containerId);
    if (!container || typeof PIXI === "undefined") {
      attempts++;
      if (attempts >= maxAttempts) {
        console.error(`PIXI or container "${containerId}" not found.`);
        return;
      }
      setTimeout(tryStart, interval);
      return;
    }

    // Load first frame to get aspect ratio and set width
    const firstFrameUrl = `https://medien-antami.b-cdn.net/PNG%20sequences/${baseFilename}/${baseFilename}${String(
      1
    ).padStart(pad, "0")}.png`;
    const img = new Image();
    img.onload = function () {
      const aspectRatio = img.width / img.height;
      const containerHeight = container.clientHeight;
      const containerWidth = containerHeight * aspectRatio;
      container.style.width = `${containerWidth}px`;

      startPixi(container);
    };
    img.onerror = function () {
      console.error(
        "Could not load first frame to detect size:",
        firstFrameUrl
      );
    };
    img.src = firstFrameUrl;
  }

  function startPixi(container) {
    const app = new PIXI.Application({
      resizeTo: container,
      backgroundAlpha: 0,
      resolution: window.devicePixelRatio || 1, // ✅ Add this line
      autoDensity: true, // ✅ Enables correct scaling
    });

    container.appendChild(app.view);

    const frames = [];
    for (let i = 1; i <= frameCount; i++) {
      const frameNumber = String(i).padStart(pad, "0");
      const url = `https://medien-antami.b-cdn.net/PNG%20sequences/${baseFilename}/${baseFilename}${frameNumber}.png`;
      frames.push(PIXI.Texture.from(url));
    }

    const anim = new PIXI.AnimatedSprite(frames);
    anim.anchor.set(0.5);
    anim.animationSpeed = fps / 60;
    anim.loop = true;
    anim.play();

    app.stage.addChild(anim);

    function scaleAndCenter() {
      const texture = anim.textures[0];
      if (!texture.baseTexture.valid) return;

      const canvasWidth = app.renderer.screen.width;
      const canvasHeight = app.renderer.screen.height;

      const frameWidth = texture.orig.width;
      const frameHeight = texture.orig.height;

      const scaleX = canvasWidth / frameWidth;
      const scaleY = canvasHeight / frameHeight;
      const scale = Math.min(scaleX, scaleY);

      anim.scale.set(scale);
      anim.x = canvasWidth / 2;
      anim.y = canvasHeight / 2;
    }

    // Run once when frame is ready
    anim.onFrameChange = () => {
      if (anim.textures[0].baseTexture.valid) {
        scaleAndCenter();
        anim.onFrameChange = null;
      }
    };

    // Scale again on resize
    app.renderer.on("resize", scaleAndCenter);
  }

  tryStart();
}
