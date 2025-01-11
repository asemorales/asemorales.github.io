document.getElementById('philosophy-show-more-btn').addEventListener("click", function (e) {
    document.getElementById('philosophy-show-more-btn-wrapper').classList.add("hidden");
    document.getElementById('philosophy-part-2').classList.remove("hidden");
});

document.getElementById('about-me-show-more-btn').addEventListener("click", function (e) {
    document.getElementById('about-me-show-more-btn-wrapper').classList.add("hidden");
    document.getElementById('about-me-part-2').classList.remove("hidden");
});
