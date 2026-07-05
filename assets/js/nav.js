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

    var switchers = document.querySelectorAll('.language-switcher__select');
    if (switchers.length && window.languageAlternates) {
        Array.prototype.forEach.call(switchers, function (switcher) {
            Array.prototype.forEach.call(switcher.options, function (option) {
                var language = option.getAttribute('data-language');
                if (window.languageAlternates[language]) {
                    option.value = window.languageAlternates[language];
                }
            });
        });
    }

    if (toggle && hidden) {
        toggle.addEventListener('click', function () {
            hidden.classList.toggle('show');
        });
    }

    document.addEventListener('change', function (event) {
        if (!event.target.matches('.language-switcher__select')) return;
        try {
            window.localStorage.setItem('preferred-language', event.target.options[event.target.selectedIndex].text.toLowerCase());
        } catch (error) {
            // Ignore storage failures; the URL still carries the language choice.
        }
        window.location.href = event.target.value;
    });

    // repopulate on resize just in case
    window.addEventListener('resize', populateHidden);
});
