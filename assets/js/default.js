window.onload = function () {
  // setThemeIcon(document.querySelector("html").getAttribute("data-theme"));
  hideSplash();
  initContent();
  // watchTheme();
};

window.onscroll = function () {
  if (document.querySelector("#hero-title").getBoundingClientRect().top <= 0) {
    document.querySelector("#navbar").classList.add("bg-base-100/75");
  } else {
    document.querySelector("#navbar").classList.remove("bg-base-100/75");
  }
};

function setThemeIcon(theme) {
  // designed to support multiple (2+) themes
  switch (theme) {
    case "light":
      document.querySelector("#sun").classList.remove("inactive-theme-icon");
      document.querySelector("#moon").classList.add("inactive-theme-icon");
      break;
    case "dark":
      document.querySelector("#moon").classList.remove("inactive-theme-icon");
      document.querySelector("#sun").classList.add("inactive-theme-icon");
      break;
  }
}

function watchTheme() {
  const mutationCallback = (mutationsList) => {
    for (const mutation of mutationsList) {
      if (mutation.type !== "attributes" || mutation.attributeName !== "data-theme") {
        return;
      }
      setThemeIcon(mutation.target.getAttribute("data-theme"));
    }
  };
  const observer = new MutationObserver(mutationCallback);
  observer.observe(document.querySelector("html"), { attributes: true });
}

function hideSplash() {
  setTimeout(function(){ 
    document.getElementById('content').style['display'] = 'block';
    document.getElementById('splash').style.opacity = 0;
  }, 1000);
}

function initContent() {
  setTimeout(function(){ 
    document.getElementById('splash').style.display = "none";
  }, 2000);
}