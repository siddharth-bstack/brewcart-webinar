/* BrewCart demo store.
 *
 * SELF-HEALING DEMO SWITCH
 * ------------------------
 * ?v=1 (default) -> "baseline" locators (ids below).
 * ?v=2           -> the SAME UI, but ids / classes / test attributes are renamed,
 *                   the way a real redesign breaks automation locators.
 * Visible text, roles and layout stay the same, which is exactly what
 * BrowserStack self-healing uses to find the element again.
 */
(function () {
  var params = new URLSearchParams(window.location.search);
  var VERSION = params.get('v') === '2' ? '2' : '1';

  var PRODUCTS = [
    { id: 1, name: 'Espresso Beans 250g', price: 12.5, emoji: '☕' },
    { id: 2, name: 'Cold Brew Kit', price: 24.0, emoji: '🧊' },
    { id: 3, name: 'Ceramic Mug', price: 9.0, emoji: '🍵' },
    { id: 4, name: 'Pour-over Dripper', price: 18.75, emoji: '🫖' }
  ];

  // Element id renames applied when v=2 (simulates a UI refactor).
  var RENAMES = {
    'brand': 'logo-main',
    'open-cart': 'cart-toggle',
    'cart-count': 'cart-qty',
    'close-cart': 'cart-dismiss',
    'checkout-btn': 'proceed-to-pay',
    'full-name': 'customer-name',
    'email': 'customer-email',
    'address': 'ship-address',
    'card': 'payment-card',
    'place-order': 'confirm-purchase',
    'order-id': 'order-ref',
    'new-order': 'restart-flow'
  };

  var cart = [];
  var $ = function (id) { return document.getElementById(RENAMES_ACTIVE(id)); };
  function RENAMES_ACTIVE(id) { return VERSION === '2' && RENAMES[id] ? RENAMES[id] : id; }

  // Apply renames to the static markup before wiring anything up.
  if (VERSION === '2') {
    Object.keys(RENAMES).forEach(function (oldId) {
      var el = document.getElementById(oldId);
      if (el) { el.id = RENAMES[oldId]; }
    });
    document.querySelectorAll('.btn.primary').forEach(function (b) {
      b.classList.remove('primary');
      b.classList.add('cta-main');
      b.style.background = '#d9822b';
      b.style.color = '#fff';
    });
  }

  var badge = document.getElementById('version-badge');
  badge.textContent = 'UI version ' + VERSION + (VERSION === '2' ? ' (locators changed)' : ' (baseline)');

  function money(n) { return n.toFixed(2); }

  function renderProducts() {
    var grid = document.getElementById('products');
    grid.innerHTML = '';
    PRODUCTS.forEach(function (p) {
      var card = document.createElement('article');
      card.className = 'card';
      card.setAttribute('data-testid', 'product-' + p.id);
      card.innerHTML =
        '<div class="emoji">' + p.emoji + '</div>' +
        '<h3>' + p.name + '</h3>' +
        '<div class="price">$' + money(p.price) + '</div>';
      var btn = document.createElement('button');
      btn.className = 'btn ' + (VERSION === '2' ? 'cta-main' : 'primary');
      btn.textContent = 'Add to cart';
      if (VERSION === '2') { btn.style.background = '#d9822b'; btn.style.color = '#fff'; }
      btn.id = (VERSION === '2' ? 'buy-' : 'add-to-cart-') + p.id;
      btn.addEventListener('click', function () { addToCart(p); });
      card.appendChild(btn);
      grid.appendChild(card);
    });
  }

  function addToCart(p) {
    cart.push(p);
    renderCart();
  }

  function renderCart() {
    $('cart-count').textContent = cart.length;
    var list = document.getElementById('cart-items');
    list.innerHTML = '';
    var total = 0;
    cart.forEach(function (p) {
      total += p.price;
      var li = document.createElement('li');
      li.innerHTML = '<span>' + p.name + '</span><span>$' + money(p.price) + '</span>';
      list.appendChild(li);
    });
    document.getElementById('cart-total').textContent = money(total);
  }

  function show(id, on) { document.getElementById(id).classList.toggle('hidden', !on); }

  $('open-cart').addEventListener('click', function (e) { e.preventDefault(); show('cart-panel', true); });
  $('close-cart').addEventListener('click', function () { show('cart-panel', false); });

  $('checkout-btn').addEventListener('click', function () {
    if (cart.length === 0) { return; }
    show('cart-panel', false);
    show('checkout', true);
    document.getElementById('checkout').scrollIntoView();
  });

  document.getElementById('checkout-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var name = $('full-name').value.trim();
    var email = $('email').value.trim();
    var address = $('address').value.trim();
    var card = $('card').value.replace(/\s+/g, '');
    var err = document.getElementById('form-error');
    if (!name || !email || !address || !card) { err.textContent = 'Please fill in all fields.'; return; }
    if (email.indexOf('@') < 1) { err.textContent = 'Please enter a valid email.'; return; }
    if (!/^\d{16}$/.test(card)) { err.textContent = 'Card number must be 16 digits.'; return; }
    err.textContent = '';
    var total = cart.reduce(function (s, p) { return s + p.price; }, 0);
    $('order-id').textContent = 'BC-' + (100000 + Math.floor(Math.random() * 900000));
    document.getElementById('confirm-summary').textContent =
      cart.length + ' item(s), total $' + money(total) + ' - confirmation sent to ' + email;
    show('checkout', false);
    show('confirmation', true);
    document.getElementById('confirmation').scrollIntoView();
  });

  $('new-order').addEventListener('click', function () {
    cart = [];
    renderCart();
    document.getElementById('checkout-form').reset();
    show('confirmation', false);
    window.scrollTo(0, 0);
  });

  renderProducts();
  renderCart();
})();
