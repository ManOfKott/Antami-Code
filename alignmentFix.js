console.log("Test message");

Weglot.initialize({
  api_key: "wg_346e327cd0357ce42ed025741527aa6f8",
});

document.addEventListener("DOMContentLoaded", async () => {
  console.log("DOM fully loaded and parsed");
  const url = window.location.pathname; // or use any URL string
  const lastSegment = url.substring(url.lastIndexOf("/") + 1);
  console.log(lastSegment);
  if (!excludedUrls.includes(lastSegment)) {
    CheckLangAndAlignment();
  } else {
    console.log("Entering from fix excluded URL");
  }
});

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const CheckLangAndAlignment = () => {
  console.log("Check Lang and Alignment!");
  var weglotCurrentLang = Weglot.getCurrentLang();
  console.log("The current Weglot language is: ", weglotCurrentLang);
  console.log(
    "document.documentElemnent.lang: ",
    document.documentElement.lang
  );

  if (!weglotCurrentLang || isArabic(weglotCurrentLang)) {
    document.documentElement.lang = "ar";
    document.body.classList.add("rtl");
    console.log(
      "The language is Arabic, but the document has a different lang. We set document lang to Arabic and the alignment to RTL. "
    );
  }

  Weglot.on("languageChanged", (newLang, prevLang) => {
    console.log("Language changed from '", prevLang, "' to '", newLang, "'");

    if (isDiffAlignment(prevLang, newLang)) {
      console.log("We need to fix the alignment.");
      const direction = isArabic(newLang) ? "rtl" : "ltr";
      fixElementAlignment(direction);
    }

    reloadVideos();
  });
};

const reloadVideos = () => {
  const videos = document.querySelectorAll(".translated-video");

  videos.forEach((video) => {
    // Alle <source>-Elemente im Video
    const sources = video.querySelectorAll("source");

    sources.forEach((source) => {
      const currentSrc = source.getAttribute("src");
      source.setAttribute("src", currentSrc); // neu setzen
    });

    video.load(); // erzwingt das Neuladen des Videos mit den neuen Quellen
  });
};

const fixElementAlignment = (direction) => {
  console.log("runAlignmentFix invoked");
  const elements = document.querySelectorAll("*");

  elements.forEach((element) => {
    // add more fixes here
    let align = element.style.textAlign;

    if (
      element.childNodes.length === 1 &&
      element.childNodes[0].nodeType === Node.TEXT_NODE
    ) {
      element.style.direction = direction;
    }

    if (align === "left") {
      element.style.textAlign = "right";
    } else if (align === "right") {
      element.style.textAlign = "left";
    }

    if (element.classList.contains("learnworlds-align-right")) {
      element.classList.remove("learnworlds-align-right");
      element.classList.add("learnworlds-align-left");
    } else if (element.classList.contains("learnworlds-align-left")) {
      element.classList.remove("learnworlds-align-left");
      element.classList.add("learnworlds-align-right");
    }

    if (element.classList.contains("fa-angle-left")) {
      element.classList.remove("fa-angle-left");
      element.classList.add("fa-angle-right");
    } else if (element.classList.contains("fa-angle-right")) {
      element.classList.remove("fa-angle-right");
      element.classList.add("fa-angle-left");
    }
  });
};

const isArabic = (lang) => {
  return !lang || lang === "ar";
};

const excludedUrls = ["terms", "cookies", "privacy"];

const isDiffAlignment = (lang1, lang2) => {
  return isArabic(lang1) !== isArabic(lang2);
};
