window.onscroll = function () {
  if (document.querySelector("#hero").getBoundingClientRect().top < 0) {
    document.querySelector("#navbar").classList.add("bg-base-100/75", "backdrop-blur-sm");
  } else {
    document.querySelector("#navbar").classList.remove("bg-base-100/75", "backdrop-blur-sm");
  }
};
