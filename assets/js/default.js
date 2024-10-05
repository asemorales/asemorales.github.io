window.onload = function() {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.querySelector('#moon').classList.toggle('invisible');
    } else {
        document.querySelector('#sun').classList.toggle('invisible');
    }
    
    document.querySelector('#toggle-theme').addEventListener('click', function() {
        document.querySelector('#moon').classList.toggle('invisible inactive-theme-icon');
        document.querySelector('#sun').classList.toggle('invisible inactive-theme-icon');
    });
};