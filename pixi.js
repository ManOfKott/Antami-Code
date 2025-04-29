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

    // Load first frame to get aspect ratio and set width
    const langPlaceholder = multiLang ? `${lang}/` : "";
    let firstFrameUrl = `https://medien-antami.b-cdn.net/PNG%20sequences/${animationName}/${langPlaceholder}${baseFilename}${String(
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

    // ⚠️ Verstecke das Canvas bis die Animation bereit ist
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
    anim.visible = false; // ⛔ erst sichtbar machen, wenn bereit

    console.log("Animation loaded:", anim);
    app.stage.addChild(anim);

    function scaleAndCenter() {
      console.log("Scaling and centering animation");
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

    anim.onFrameChange = () => {
      if (anim.textures[0].baseTexture.valid) {
        console.log("Animation is ready to play. Making it visible now.");
        scaleAndCenter();
        anim.visible = true;
        anim.play();

        // ✅ Zeige das Canvas jetzt erst
        requestAnimationFrame(() => {
          app.view.style.visibility = "visible";
          app.view.style.opacity = "1";
        });

        anim.onFrameChange = null;
      }
    };

    app.renderer.on("resize", scaleAndCenter);
  }

  tryStart();
}
