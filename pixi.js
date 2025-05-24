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
  disappear = false,
  initialDelay = 1000,
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

    container.style.opacity = "0";

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
    anim.loop = !disappear; // 👈 important: loop normally if no disappear
    anim.visible = false;

    app.stage.addChild(anim);

    function scaleAndCenter() {
      const texture = anim.textures[0];
      if (!texture.baseTexture.valid) {
        console.error("Texture not valid yet, skipping scaling and centering");
        return;
      }

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

    app.renderer.on("resize", scaleAndCenter);

    // Fade control logic
    function fadeOut() {
      container.style.opacity = "0";
    }

    function fadeIn() {
      container.style.opacity = "1";
    }

    function waitAndRestart() {
      setTimeout(() => {
        anim.gotoAndPlay(0);
        fadeIn();
      }, 7000); // 7 seconds
    }

    if (disappear) {
      anim.loop = false;
      anim.onComplete = () => {
        fadeOut();
        waitAndRestart();
      };
    }

    // ✅ Hier Änderung: Animation erst starten, wenn die erste Textur geladen ist!
    const firstTexture = anim.textures[0].baseTexture;

    function startAnimationProperly() {
      scaleAndCenter();
      anim.visible = true;

      setTimeout(() => {
        container.style.transition = "opacity 1s ease";
        anim.play();
        fadeIn();
      }, initialDelay); // 2 seconds delay before starting the animation
    }

    if (firstTexture.valid) {
      startAnimationProperly(); // ✅
    } else {
      firstTexture.on("loaded", () => {
        startAnimationProperly(); // ✅
      });
    }

    return app;
  }

  tryStart();
}

function setupPixiAnimationWithLangSupport(animationConfig) {
  const { multiLang } = animationConfig;

  // Store current Pixi Application to destroy it on lang change
  let currentApp = null;

  // Wrapper to safely destroy previous app instance
  function destroyPreviousAnimation(containerId) {
    const container = document.getElementById(containerId);
    if (container && container.firstChild) {
      container.innerHTML = "";
    }
    if (currentApp) {
      currentApp.destroy(true, { children: true });
      currentApp = null;
    }
  }

  // Initialize animation with current language
  function loadAnimation(lang) {
    const configWithLang = { ...animationConfig, lang };
    destroyPreviousAnimation(animationConfig.containerId);
    currentApp = initPixiAnimation(configWithLang);
  }

  // Initial load
  const initialLang = multiLang
    ? Weglot.getCurrentLang()
    : animationConfig.lang;
  loadAnimation(initialLang);

  // If multiLang, setup language change listener
  if (multiLang) {
    Weglot.on("languageChanged", (newLang) => {
      loadAnimation(newLang);
    });
  }
}
