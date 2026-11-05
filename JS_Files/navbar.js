const header = document.querySelector('header');
const toggle = document.querySelector('.nav_collapse');
const nav = document.querySelector('.navflex');
const list = nav.querySelector('ul');

function closeMenu() {
    nav.classList.remove('show');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open menu');
}

// shows the full navbar if every link fits on one line, otherwise the hamburger
function checkFit() {
    header.classList.remove('nav_collapsed');               // briefly lay out as one row
    const fits = list.scrollWidth <= list.clientWidth;      // do the links overflow?
    header.classList.toggle('nav_collapsed', !fits);
    if (fits) closeMenu();                                  // reset menu when switching back
}

toggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('show');
    toggle.setAttribute('aria-expanded', isOpen);
    toggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
});

window.addEventListener('resize', checkFit);
checkFit();

// Profile icon JS

// Shows the logged-in user's initials in the profile icon
(async () => {
    const link = document.querySelector(".profile_link");
    if (!link || typeof db === "undefined") return;

    const { data } = await db.auth.getUser();
    if (!data || !data.user) return; // not logged in, so keep the default icon

    const { data: info } = await db
        .from("userinfo")
        .select("fname, lname")
        .eq("user_id", data.user.id)
        .maybeSingle();

    if (info && info.fname) {
        const initials = info.fname[0] + (info.lname ? info.lname[0] : "");
        link.querySelector(".profile_icon").setAttribute("hidden", "");
        const span = link.querySelector(".profile_initials");
        span.textContent = initials.toUpperCase();
        span.hidden = false;
    }
})();

// Adds ?redirect=<this page> to every Login/Register link,
// so the user comes back here after logging in or signing up
(() => {
    const onAuthPage = /\/(Login|Register)\.html$/i.test(location.pathname);

    // On the login/register pages, keep passing along where the user originally came from
    const returnTo = onAuthPage
        ? new URLSearchParams(location.search).get("redirect")
        : location.pathname + location.search + location.hash;
    if (!returnTo) return;

    document.querySelectorAll('a[href$="Login.html"], a[href$="Register.html"]').forEach(link => {
        const url = new URL(link.getAttribute("href"), location.href);
        url.searchParams.set("redirect", returnTo);
        link.href = url.pathname + url.search;
    });
})();