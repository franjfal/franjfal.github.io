// simple mobile menu toggler
window.addEventListener('DOMContentLoaded', function () {
    var toggle = document.querySelector('.greedy-nav__toggle');
    var hidden = document.querySelector('.greedy-nav .hidden-links');
    var visible = document.querySelector('.greedy-nav .visible-links');

    function populateHidden() {
        if (visible && hidden && hidden.children.length === 0) {
            // clone the visible link list into hidden menu
            hidden.innerHTML = visible.innerHTML;
        }
    }

    populateHidden();

    if (toggle && hidden) {
        toggle.addEventListener('click', function () {
            hidden.classList.toggle('show');
        });
    }

    // repopulate on resize just in case
    window.addEventListener('resize', populateHidden);
});