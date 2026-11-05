/* BrewCart account: sign up / log in, order history, 3-step checkout, support (FAQ + contact). */
(function (BC) {
  var S = BC.state, $ = BC.$, raw = BC.raw, money = BC.money, show = BC.show;
  var shop = BC.shop;
  var EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

  /* ---------- auth ---------- */
  function renderAuthState() {
    $('account-label').textContent = S.user ? S.user.name.split(' ')[0] : 'Sign in';
    $('nav-account').setAttribute('href', S.user ? '#/account' : '#/login');
  }
  function setTab(which) {
    var login = which === 'login';
    raw(BC.rid('tab-login')).classList.toggle('active', login);
    raw(BC.rid('tab-signup')).classList.toggle('active', !login);
    show('login-form', login); show('signup-form', !login);
  }
  $('tab-login').addEventListener('click', function () { setTab('login'); });
  $('tab-signup').addEventListener('click', function () { setTab('signup'); });

  raw('signup-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var name = $('signup-name').value.trim(), email = $('signup-email').value.trim().toLowerCase();
    var pw = $('signup-password').value, conf = $('signup-confirm').value;
    var err = raw('signup-error');
    if (!name || !email || !pw || !conf) { err.textContent = 'Please fill in all fields.'; return; }
    if (!EMAIL_RE.test(email)) { err.textContent = 'Please enter a valid email.'; return; }
    if (pw.length < 8) { err.textContent = 'Password must be at least 8 characters.'; return; }
    if (pw !== conf) { err.textContent = 'Passwords do not match.'; return; }
    if (!$('signup-terms').checked) { err.textContent = 'Please accept the terms.'; return; }
    if (S.users.some(function (u) { return u.email === email; })) { err.textContent = 'An account with this email already exists.'; return; }
    S.user = { name: name, email: email, password: pw };
    S.users.push(S.user);
    BC.save(); err.textContent = '';
    renderAuthState();
    BC.toast('Welcome to BrewCart, ' + name.split(' ')[0] + '!');
    BC.go('#/account');
  });

  raw('login-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var email = $('login-email').value.trim().toLowerCase(), pw = $('login-password').value;
    var err = raw('login-error');
    if (!email || !pw) { err.textContent = 'Enter your email and password.'; return; }
    var u = S.users.filter(function (x) { return x.email === email && x.password === pw; })[0];
    if (!u) { err.textContent = 'Invalid email or password.'; return; }
    S.user = u; BC.save(); err.textContent = '';
    renderAuthState();
    BC.toast('Logged in as ' + u.name);
    BC.go('#/account');
  });

  $('logout-btn').addEventListener('click', function () {
    S.user = null; BC.save(); renderAuthState();
    BC.toast('You have been logged out');
    BC.go('#/');
  });

  /* ---------- account / orders ---------- */
  function renderAccount() {
    if (!S.user) { BC.go('#/login'); return; }
    raw('account-title').textContent = 'Hi, ' + S.user.name;
    raw('account-email').textContent = S.user.email;
    var mine = S.orders.filter(function (o) { return o.email === S.user.email; });
    show('orders-empty', mine.length === 0);
    show(BC.rid('orders-table'), mine.length > 0);
    var body = raw('orders-body');
    body.innerHTML = '';
    mine.forEach(function (o) {
      var tr = document.createElement('tr');
      tr.innerHTML = '<td>' + o.id + '</td><td>' + o.date + '</td><td>' + o.items + '</td><td>$' + o.total + '</td><td><span class="status">' + o.status + '</span></td>';
      body.appendChild(tr);
    });
  }
  BC.onRoute('account', renderAccount);
  BC.onRoute('login', function () { setTab('login'); });

  /* ---------- checkout (3 steps) ---------- */
  $('checkout-btn').addEventListener('click', function () {
    if (!shop.cartLines().length) { return; }
    shop.openCart(false);
    BC.go('#/checkout');
  });
  BC.onRoute('checkout', function () {
    if (!shop.cartLines().length) { BC.toast('Your cart is empty'); BC.go('#/'); return; }
    if (S.user) {
      if (!$('full-name').value) { $('full-name').value = S.user.name; }
      if (!$('email').value) { $('email').value = S.user.email; }
    }
    setStep(1);
  });

  function setStep(n) {
    S.step = n;
    [1, 2, 3].forEach(function (i) {
      show('panel-' + i, i === n);
      var s = raw('step-' + i);
      s.classList.toggle('active', i === n);
      s.classList.toggle('done', i < n);
    });
    show(BC.rid('back-btn'), n > 1);
    show(BC.rid('next-btn'), n < 3);
    show(BC.rid('place-order'), n === 3);
    raw('form-error').textContent = '';
    shop.renderCart();
    if (n === 3) { renderReview(); }
  }
  function renderReview() {
    var list = raw('review-items');
    list.innerHTML = '';
    shop.cartLines().forEach(function (l) {
      var li = document.createElement('li');
      li.innerHTML = '<span class="ci-emoji">' + l.p.emoji + '</span><span class="ci-info">' + l.p.name + ' × ' + l.qty + '</span><span>$' + money(l.p.price * l.qty) + '</span>';
      list.appendChild(li);
    });
    var t = shop.totals();
    raw('review-ship').textContent = 'Shipping: $' + money(t.shipping) + (S.promo ? ' · Promo ' + S.promo + ' applied' : '');
    raw('review-total').textContent = money(t.total);
  }
  function validateStep(n) {
    if (n === 1) {
      if (!$('full-name').value.trim() || !$('email').value.trim() || !$('address').value.trim() || !$('city').value.trim()) { return 'Please fill in all shipping fields.'; }
      if (!EMAIL_RE.test($('email').value.trim())) { return 'Please enter a valid email.'; }
    }
    if (n === 2) {
      if (!$('card-name').value.trim() || !$('card').value.trim() || !$('expiry').value.trim() || !$('cvv').value.trim()) { return 'Please fill in all payment fields.'; }
      if (!/^\d{16}$/.test($('card').value.replace(/\s+/g, ''))) { return 'Card number must be 16 digits.'; }
      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test($('expiry').value.trim())) { return 'Expiry must be MM/YY.'; }
      if (!/^\d{3}$/.test($('cvv').value.trim())) { return 'CVV must be 3 digits.'; }
    }
    return '';
  }
  $('ship-method').addEventListener('change', shop.renderCart);
  $('next-btn').addEventListener('click', function () {
    var err = validateStep(S.step);
    if (err) { raw('form-error').textContent = err; return; }
    setStep(S.step + 1);
  });
  $('back-btn').addEventListener('click', function () { setStep(S.step - 1); });

  raw('checkout-form').addEventListener('submit', function (e) {
    e.preventDefault();
    if (!$('terms').checked) { raw('form-error').textContent = 'Please accept the terms and conditions.'; return; }
    var t = shop.totals();
    var email = $('email').value.trim();
    var id = 'BC-' + (100000 + Math.floor(Math.random() * 900000));
    var count = shop.cartLines().reduce(function (s, l) { return s + l.qty; }, 0);
    S.orders.unshift({ id: id, email: S.user ? S.user.email : email, date: new Date().toLocaleDateString(), items: count, total: money(t.total), status: 'Processing' });
    BC.save();
    $('order-id').textContent = id;
    raw('confirm-summary').textContent = count + ' item(s), total $' + money(t.total) + ' - confirmation sent to ' + email;
    S.cart = {}; S.promo = null;
    raw('checkout-form').reset();
    shop.renderCart();
    BC.go('#/confirmation');
  });
  $('new-order').addEventListener('click', function () { BC.go('#/'); });

  /* ---------- support: FAQ + contact ---------- */
  var FAQ = [
    ['How long does shipping take?', 'Standard shipping takes 3-5 days, Express takes 1-2 days.'],
    ['Do you ship internationally?', 'Not yet. We currently ship within the UK and EU.'],
    ['What is your return policy?', 'Unopened items can be returned within 30 days for a full refund.'],
    ['How do I use a promo code?', 'Open your cart and enter the code, for example BREW10, then press Apply.']
  ];
  var faq = raw('faq');
  FAQ.forEach(function (f) {
    var d = document.createElement('details');
    d.innerHTML = '<summary>' + f[0] + '</summary><p>' + f[1] + '</p>';
    faq.appendChild(d);
  });
  raw('contact-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var err = raw('contact-error');
    var name = $('contact-name').value.trim(), email = $('contact-email').value.trim();
    var topic = $('contact-topic').value, msg = $('contact-message').value.trim();
    show('contact-success', false);
    if (!name || !email || !topic || !msg) { err.textContent = 'Please complete all fields.'; return; }
    if (!EMAIL_RE.test(email)) { err.textContent = 'Please enter a valid email.'; return; }
    if (msg.length < 15) { err.textContent = 'Message must be at least 15 characters.'; return; }
    err.textContent = '';
    var ticket = 'TKT-' + (1000 + Math.floor(Math.random() * 9000));
    var ok = raw('contact-success');
    ok.textContent = 'Thanks ' + name.split(' ')[0] + '! Your ticket ' + ticket + ' has been created. We will reply to ' + email + ' within 24 hours.';
    show('contact-success', true);
    raw('contact-form').reset();
  });

  renderAuthState();
  BC.route();
  window.addEventListener('hashchange', BC.route);
})(window.BC);
