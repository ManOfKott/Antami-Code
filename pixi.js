function initPixiAnimation({
  frameCount,
  baseFilename,
  animationName,
  containerId,
  fps = 25,
  pad = 3,
  maxAttempts = 100,
  interval = 50,
  multiLang = false,
  lang = "ar",
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

    const langPlaceholder = multiLang ? `${lang}/` : "";
    const firstFrameUrl = `https://medien-antami.b-cdn.net/PNG%20sequences/${animationName}/${langPlaceholder}${baseFilename}${String(
      1
    ).padStart(pad, "0")}.png`;

    const img = new Image();
    img.onload = function () {
      const aspectRatio = img.width / img.height;
      const containerHeight =
        container.clientHeight ||
        parseFloat(getComputedStyle(container).height);
      const containerWidth = containerHeight * aspectRatio;
      container.style.width = `${containerWidth}px`;

      console.log(
        `Container height set to ${containerHeight}px based on aspect ratio ${aspectRatio}`
      );
      console.log(
        `Container width set to ${containerWidth}px based on aspect ratio ${aspectRatio}`
      );

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
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    container.appendChild(app.view);

    // Hide the canvas until ready
    app.view.style.visibility = "hidden";
    app.view.style.opacity = "0";
    app.view.style.transition = "opacity 0.3s ease";

    const frames = [];
    for (let i = 1; i <= frameCount; i++) {
      const frameNumber = String(i).padStart(pad, "0");
      const langPlaceholder = multiLang ? `${lang}/` : "";
      const url = `https://medien-antami.b-cdn.net/PNG%20sequences/${animationName}/${langPlaceholder}${baseFilename}${frameNumber}.png`;
      frames.push(PIXI.Texture.from(url));
    }

    const anim = new PIXI.AnimatedSprite(frames);
    anim.anchor.set(0.5);
    anim.animationSpeed = fps / 60;
    anim.loop = true;
    anim.visible = false;

    app.stage.addChild(anim);

    function scaleAndCenter() {
      console.log("Scaling and centering animation");
      const texture = anim.textures[0];
      if (!texture.baseTexture.valid) {
        console.error("Texture not valid yet, skipping scaling and centering");
        return;
      } else {
        console.log("Texture is valid, proceeding with scaling and centering");
      }

      const canvasWidth = app.renderer.screen.width;
      const canvasHeight = app.renderer.screen.height;
      const frameWidth = texture.orig.width;
      const frameHeight = texture.orig.height;
      console.log(
        `Frame size: ${frameWidth}x${frameHeight}, Canvas size: ${canvasWidth}x${canvasHeight}`
      );

      const scaleX = canvasWidth / frameWidth;
      const scaleY = canvasHeight / frameHeight;
      const scale = Math.min(scaleX, scaleY);

      console.log(`Scale: ${scale}`);
      anim.scale.set(scale);

      console.log(
        `Animation position before centering: x=${anim.x}, y=${anim.y}`
      );
      anim.x = -1 * (canvasWidth / 2);
      anim.y = -1 * (canvasHeight / 2);
      console.log(
        `Animation position after centering: x=${anim.x}, y=${anim.y}`
      );
    }

    app.renderer.on("resize", scaleAndCenter);

    // Start playing the animation immediately
    anim.play();
    anim.visible = true;

    // Wait for first texture to be ready before scaling
    const firstTexture = anim.textures[0].baseTexture;

    if (firstTexture.valid) {
      scaleAndCenter();
    } else {
      firstTexture.on("loaded", () => {
        scaleAndCenter();
      });
    }

    // Show the canvas once ready
    requestAnimationFrame(() => {
      console.log("Animation is ready, showing canvas");
      app.view.style.visibility = "visible";
      app.view.style.opacity = "1";
    });
  }

  tryStart();
}
