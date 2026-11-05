/* BrewCart core: data, state, helpers, routing.
 *
 * SELF-HEALING DEMO SWITCH
 * ?v=1 (default) -> baseline element ids.
 * ?v=2           -> same UI/text/layout, but ids and primary button classes are renamed
 *                   (a realistic redesign). Id-based scripts break; self-healing recovers them.
 */
window.BC = (function () {
  var params = new URLSearchParams(window.location.search);
  var VERSION = params.get('v') === '2' ? '2' : '1';

  var PRODUCTS = [
    { id: 1, name: 'Espresso Beans 250g', cat: 'Beans', price: 12.5, rating: 4.7, emoji: '☕', badge: 'Bestseller', stock: 24, roast: 'Dark', origin: 'Brazil', desc: 'Dark roast with notes of cocoa and toasted almond. Great for espresso.' },
    { id: 2, name: 'Ethiopia Yirgacheffe 250g', cat: 'Beans', price: 15.0, rating: 4.8, emoji: '🫘', badge: 'New', stock: 12, roast: 'Light', origin: 'Ethiopia', desc: 'Light roast, bright and floral with citrus and jasmine notes.' },
    { id: 3, name: 'Cold Brew Kit', cat: 'Gear', price: 24.0, rating: 4.4, emoji: '🧊', stock: 7, roast: '-', origin: '-', desc: 'Everything you need to make smooth cold brew at home.' },
    { id: 4, name: 'Pour-over Dripper', cat: 'Gear', price: 18.75, rating: 4.6, emoji: '🫖', stock: 30, roast: '-', origin: '-', desc: 'Ceramic dripper for a clean, balanced cup.' },
    { id: 5, name: 'Burr Grinder', cat: 'Gear', price: 49.0, rating: 4.9, emoji: '⚙️', badge: 'Top rated', stock: 3, roast: '-', origin: '-', desc: 'Adjustable conical burr grinder for consistent grounds.' },
    { id: 6, name: 'Ceramic Mug', cat: 'Mugs', price: 9.0, rating: 4.3, emoji: '🍵', stock: 40, roast: '-', origin: '-', desc: 'Hand-glazed 350ml mug that keeps your coffee warm.' },
    { id: 7, name: 'Travel Tumbler', cat: 'Mugs', price: 22.0, rating: 4.5, emoji: '🥤', stock: 0, roast: '-', origin: '-', desc: 'Insulated 500ml tumbler, leak-proof lid.' },
    { id: 8, name: 'Decaf House Blend 250g', cat: 'Beans', price: 11.0, rating: 4.1, emoji: '🌙', stock: 18, roast: 'Medium', origin: 'Colombia', desc: 'Swiss-water decaf, smooth and nutty.' }
  ];
  var CATEGORIES = ['All', 'Beans', 'Gear', 'Mugs'];
  var PROMOS = { BREW10: 0.10 };
  var EXPRESS_FEE = 9.0;

  // Element id renames applied when v=2 (simulates a UI refactor).
  var RENAMES = {
    'brand': 'logo-main', 'search-input': 'site-search', 'open-cart': 'cart-toggle',
    'cart-count': 'cart-qty', 'wishlist-btn': 'favorites-btn', 'close-cart': 'cart-dismiss',
    'checkout-btn': 'proceed-to-pay', 'apply-promo': 'redeem-code', 'promo-input': 'coupon-field',
    'full-name': 'customer-name', 'email': 'customer-email', 'address': 'ship-address',
    'city': 'ship-city', 'ship-method': 'delivery-option', 'card-name': 'holder-name',
    'card': 'payment-card', 'expiry': 'card-expiry', 'cvv': 'card-cvv', 'terms': 'accept-terms',
    'next-btn': 'continue-btn', 'back-btn': 'previous-btn', 'place-order': 'confirm-purchase',
    'order-id': 'order-ref', 'new-order': 'restart-flow', 'cart-total': 'grand-total',
    'nav-account': 'account-link', 'account-label': 'account-text',
    'login-email': 'signin-email', 'login-password': 'signin-password', 'login-submit': 'signin-submit',
    'tab-signup': 'tab-register', 'tab-login': 'tab-signin',
    'signup-name': 'register-name', 'signup-email': 'register-email', 'signup-password': 'register-password',
    'signup-confirm': 'register-confirm', 'signup-terms': 'register-terms', 'signup-submit': 'register-submit',
    'logout-btn': 'signout-btn', 'orders-table': 'order-history',
    'pd-add': 'pd-buy', 'pd-wish': 'pd-save', 'pd-compare': 'pd-cmp',
    'review-rating': 'rating-select', 'review-text': 'review-body', 'review-submit': 'review-post',
    'contact-name': 'support-name', 'contact-email': 'support-email', 'contact-topic': 'support-topic',
    'contact-message': 'support-message', 'contact-submit': 'support-send',
    'newsletter-email': 'subscribe-email', 'newsletter-submit': 'subscribe-btn'
  };

  var state = {
    cat: 'All', query: '', sort: 'featured',
    cart: {}, wish: {}, compare: [], promo: null,
    user: null, step: 1, pdId: null, pdQty: 1, qvId: null, qvQty: 1,
    users: JSON.parse(localStorage.getItem('bc_users') || '[]'),
    orders: JSON.parse(localStorage.getItem('bc_orders') || '[]'),
    reviews: JSON.parse(localStorage.getItem('bc_reviews') || '{}')
  };
  var sessionEmail = localStorage.getItem('bc_session');
  if (sessionEmail) { state.user = state.users.filter(function (u) { return u.email === sessionEmail; })[0] || null; }

  function rid(id) { return VERSION === '2' && RENAMES[id] ? RENAMES[id] : id; }
  function $(id) { return document.getElementById(rid(id)); }
  function raw(id) { return document.getElementById(id); }
  function money(n) { return n.toFixed(2); }
  function byId(id) { return PRODUCTS.filter(function (p) { return p.id === id; })[0]; }
  function show(id, on) { raw(id).classList.toggle('hidden', !on); }
  function save() {
    localStorage.setItem('bc_users', JSON.stringify(state.users));
    localStorage.setItem('bc_orders', JSON.stringify(state.orders));
    localStorage.setItem('bc_reviews', JSON.stringify(state.reviews));
    if (state.user) { localStorage.setItem('bc_session', state.user.email); } else { localStorage.removeItem('bc_session'); }
  }

  var toastTimer;
  function toast(msg) {
    var t = raw('toast');
    t.textContent = msg;
    t.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.add('hidden'); }, 2400);
  }

  // Apply v2 renames to the static markup before any wiring.
  if (VERSION === '2') {
    Object.keys(RENAMES).forEach(function (oldId) {
      var el = document.getElementById(oldId);
      if (el) { el.id = RENAMES[oldId]; }
    });
    document.querySelectorAll('.btn.primary').forEach(function (b) {
      b.classList.remove('primary');
      b.classList.add('cta-main');
    });
  }
  raw('version-badge').textContent = 'UI version ' + VERSION + (VERSION === '2' ? ' (locators changed)' : ' (baseline)');

  /* ---------- hash router ---------- */
  var VIEWS = ['home', 'product', 'compare', 'wishlist', 'login', 'account', 'support', 'checkout', 'confirmation'];
  var routeHooks = {};
  function showView(name) {
    VIEWS.forEach(function (v) { show('view-' + v, v === name); });
    ['nav-shop', 'nav-compare', 'nav-support'].forEach(function (n) { raw(n).classList.remove('active'); });
    if (name === 'home') { raw('nav-shop').classList.add('active'); }
    if (name === 'compare') { raw('nav-compare').classList.add('active'); }
    if (name === 'support') { raw('nav-support').classList.add('active'); }
    window.scrollTo(0, 0);
  }
  function route() {
    var h = window.location.hash || '#/';
    var m = h.match(/^#\/product\/(\d+)$/);
    var name = 'home';
    if (m) { name = 'product'; state.pdId = +m[1]; }
    else if (h === '#/compare') { name = 'compare'; }
    else if (h === '#/wishlist') { name = 'wishlist'; }
    else if (h === '#/login') { name = state.user ? 'account' : 'login'; }
    else if (h === '#/account') { name = state.user ? 'account' : 'login'; }
    else if (h === '#/support') { name = 'support'; }
    else if (h === '#/checkout') { name = 'checkout'; }
    else if (h === '#/confirmation') { name = 'confirmation'; }
    else if (h === '#shop') { name = 'home'; }
    showView(name);
    if (routeHooks[name]) { routeHooks[name](); }
  }
  function onRoute(name, fn) { routeHooks[name] = fn; }
  function go(hash) { if (window.location.hash === hash) { route(); } else { window.location.hash = hash; } }

  return {
    VERSION: VERSION, PRODUCTS: PRODUCTS, CATEGORIES: CATEGORIES, PROMOS: PROMOS, EXPRESS_FEE: EXPRESS_FEE,
    state: state, rid: rid, $: $, raw: raw, money: money, byId: byId, show: show, save: save, toast: toast,
    route: route, onRoute: onRoute, go: go
  };
})();
