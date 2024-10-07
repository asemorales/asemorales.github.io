window.onload = function () {

    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.querySelector('html').classList.toggle('dark');
        document.querySelector('#moon').classList.toggle('inactive-theme-icon');
    } else {
        document.querySelector('#sun').classList.toggle('inactive-theme-icon');
    }

    // listeners

    document.querySelector('#toggle-theme').addEventListener('click', function() {
        document.querySelector('html').classList.toggle('dark');
        document.querySelector('#moon').classList.toggle('inactive-theme-icon');
        document.querySelector('#sun').classList.toggle('inactive-theme-icon');
    });
};

window.onscroll = function() {
    if (document.querySelector('#about').getBoundingClientRect().bottom <= 0) {
        document.querySelector('#nav-title').classList.remove('opacity-0');
    } else {
        document.querySelector('#nav-title').classList.add('opacity-0');
    }
}