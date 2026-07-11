window.addEventListener('DOMContentLoaded', function () {
    var mobileToggle = document.querySelector('.mobile-nav__toggle');
    var mobileMenu = document.getElementById('mobile-site-menu');

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

    function closeMobileMenu() {
        if (!mobileToggle || !mobileMenu) return;
        mobileMenu.hidden = true;
        mobileToggle.setAttribute('aria-expanded', 'false');
        mobileToggle.classList.remove('close');
    }

    if (mobileToggle && mobileMenu) {
        mobileToggle.addEventListener('click', function () {
            var opening = mobileMenu.hidden;
            mobileMenu.hidden = !opening;
            mobileToggle.setAttribute('aria-expanded', String(opening));
            mobileToggle.classList.toggle('close', opening);
        });

        document.addEventListener('click', function (event) {
            if (mobileMenu.hidden || event.target.closest('.greedy-nav')) return;
            closeMobileMenu();
        });

        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape') closeMobileMenu();
        });

        window.addEventListener('resize', function () {
            if (window.innerWidth > 1024) closeMobileMenu();
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
});
