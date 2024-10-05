window.onload = function() {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.querySelector('#moon').classList.toggle('inactive-theme-icon');
    } else {
        document.querySelector('#sun').classList.toggle('inactive-theme-icon');
    }
    
    document.querySelector('#toggle-theme').addEventListener('click', function() {
        document.querySelector('#moon').classList.toggle('inactive-theme-icon');
        document.querySelector('#sun').classList.toggle('inactive-theme-icon');
    });
};