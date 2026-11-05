/* BrewCart shop: catalogue, product page, reviews, compare, wishlist, cart drawer. */
(function (BC) {
  var S = BC.state, $ = BC.$, raw = BC.raw, money = BC.money, show = BC.show, byId = BC.byId;
  var cartCls = BC.VERSION === '2' ? 'cta-main' : 'primary';

  function stars(r) { return '★'.repeat(Math.round(r)) + '☆'.repeat(5 - Math.round(r)); }
  function avgRating(p) {
    var rs = S.reviews[p.id] || [];
    if (!rs.length) { return p.rating; }
    var sum = rs.reduce(function (s, r) { return s + r.rating; }, p.rating * 5);
    return sum / (rs.length + 5);
  }
  function stockLabel(p) {
    if (p.stock === 0) { return { t: 'Out of stock', c: 'out' }; }
    if (p.stock <= 5) { return { t: 'Only ' + p.stock + ' left', c: 'low' }; }
    return { t: 'In stock', c: 'in' };
  }

  /* ---------- catalogue ---------- */
  function visibleProducts() {
    var q = S.query.trim().toLowerCase();
    var list = BC.PRODUCTS.filter(function (p) {
      return (S.cat === 'All' || p.cat === S.cat) && (!q || (p.name + ' ' + p.cat + ' ' + p.desc).toLowerCase().indexOf(q) !== -1);
    });
    if (S.sort === 'price-asc') { list.sort(function (a, b) { return a.price - b.price; }); }
    if (S.sort === 'price-desc') { list.sort(function (a, b) { return b.price - a.price; }); }
    if (S.sort === 'rating') { list.sort(function (a, b) { return avgRating(b) - avgRating(a); }); }
    return list;
  }

  function renderChips() {
    var wrap = raw('category-chips');
    wrap.innerHTML = '';
    BC.CATEGORIES.forEach(function (c) {
      var b = document.createElement('button');
      b.className = 'chip' + (S.cat === c ? ' active' : '');
      b.textContent = c;
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', S.cat === c ? 'true' : 'false');
      b.addEventListener('click', function () { S.cat = c; renderChips(); renderProducts(); });
      wrap.appendChild(b);
    });
  }

  function renderProducts() {
    var grid = raw('products');
    var list = visibleProducts();
    grid.innerHTML = '';
    raw('result-count').textContent = list.length + ' product' + (list.length === 1 ? '' : 's');
    show('empty-state', list.length === 0);
    list.forEach(function (p) {
      var st = stockLabel(p);
      var card = document.createElement('article');
      card.className = 'card';
      card.setAttribute('data-testid', 'product-' + p.id);
      card.innerHTML =
        (p.badge ? '<span class="badge">' + p.badge + '</span>' : '') +
        '<a class="emoji" href="#/product/' + p.id + '" title="View details">' + p.emoji + '</a>' +
        '<h3><a href="#/product/' + p.id + '">' + p.name + '</a></h3>' +
        '<div class="rating">' + stars(avgRating(p)) + ' <span class="muted">' + avgRating(p).toFixed(1) + '</span></div>' +
        '<div class="price">$' + money(p.price) + '</div>' +
        '<div class="stock ' + st.c + '">' + st.t + '</div>';

      var heart = document.createElement('button');
      heart.className = 'heart' + (S.wish[p.id] ? ' on' : '');
      heart.textContent = S.wish[p.id] ? '♥' : '♡';
      heart.setAttribute('aria-label', 'Add ' + p.name + ' to wishlist');
      heart.addEventListener('click', function () { toggleWish(p.id); });
      card.appendChild(heart);

      var actions = document.createElement('div');
      actions.className = 'card-actions';
      var quick = document.createElement('button');
      quick.className = 'btn secondary';
      quick.textContent = 'Quick view';
      quick.addEventListener('click', function () { openQuickView(p.id); });
      var add = document.createElement('button');
      add.className = 'btn ' + cartCls;
      add.textContent = p.stock === 0 ? 'Sold out' : 'Add to cart';
      add.disabled = p.stock === 0;
      add.id = (BC.VERSION === '2' ? 'buy-' : 'add-to-cart-') + p.id;
      add.addEventListener('click', function () { addToCart(p.id, 1); });
      actions.appendChild(quick);
      actions.appendChild(add);
      card.appendChild(actions);
      grid.appendChild(card);
    });
  }

  /* ---------- wishlist & compare ---------- */
  function updateBadges() {
    raw('wishlist-count').textContent = Object.keys(S.wish).length;
    raw('compare-count').textContent = S.compare.length;
  }
  function toggleWish(id) {
    if (S.wish[id]) { delete S.wish[id]; BC.toast('Removed from wishlist'); }
    else { S.wish[id] = true; BC.toast('Saved to wishlist'); }
    updateBadges(); renderProducts();
    if (S.pdId === id) { renderProduct(); }
    if (!raw('view-wishlist').classList.contains('hidden')) { renderWishlist(); }
  }
  function renderWishlist() {
    var ids = Object.keys(S.wish);
    var list = raw('wishlist-list');
    list.innerHTML = '';
    show('wishlist-empty', ids.length === 0);
    ids.forEach(function (id) {
      var p = byId(+id);
      var li = document.createElement('li');
      li.innerHTML = '<span class="ci-emoji">' + p.emoji + '</span><span class="ci-info"><a href="#/product/' + p.id + '">' + p.name + '</a><small>$' + money(p.price) + '</small></span>';
      var mv = document.createElement('button'); mv.className = 'btn secondary'; mv.textContent = 'Move to cart';
      mv.addEventListener('click', function () { delete S.wish[p.id]; addToCart(p.id, 1); updateBadges(); renderWishlist(); renderProducts(); });
      var rm = document.createElement('button'); rm.className = 'remove-btn'; rm.textContent = 'Remove';
      rm.addEventListener('click', function () { toggleWish(p.id); });
      li.appendChild(mv); li.appendChild(rm);
      list.appendChild(li);
    });
  }
  function toggleCompare(id) {
    var i = S.compare.indexOf(id);
    if (i >= 0) { S.compare.splice(i, 1); BC.toast('Removed from comparison'); }
    else if (S.compare.length >= 3) { BC.toast('You can compare up to 3 products'); return; }
    else { S.compare.push(id); BC.toast('Added to comparison'); }
    updateBadges();
    if (S.pdId === id) { renderProduct(); }
  }
  function renderCompare() {
    var table = raw('compare-table');
    var has = S.compare.length > 0;
    show('compare-empty', !has); show('compare-table', has); show('compare-clear', has);
    if (!has) { return; }
    var items = S.compare.map(byId);
    function row(label, fn) { return '<tr><th>' + label + '</th>' + items.map(function (p) { return '<td>' + fn(p) + '</td>'; }).join('') + '</tr>'; }
    table.innerHTML =
      '<tr><th></th>' + items.map(function (p) { return '<td><span class="ci-emoji">' + p.emoji + '</span><br><a href="#/product/' + p.id + '">' + p.name + '</a></td>'; }).join('') + '</tr>' +
      row('Price', function (p) { return '$' + money(p.price); }) +
      row('Rating', function (p) { return avgRating(p).toFixed(1) + ' / 5'; }) +
      row('Category', function (p) { return p.cat; }) +
      row('Roast', function (p) { return p.roast; }) +
      row('Origin', function (p) { return p.origin; }) +
      row('Availability', function (p) { return stockLabel(p).t; });
  }
  raw('compare-clear').addEventListener('click', function () { S.compare = []; updateBadges(); renderCompare(); });

  /* ---------- product detail + reviews ---------- */
  function renderProduct() {
    var p = byId(S.pdId);
    if (!p) { BC.go('#/'); return; }
    var st = stockLabel(p);
    raw('pd-emoji').textContent = p.emoji;
    raw('pd-title').textContent = p.name;
    raw('pd-rating').textContent = stars(avgRating(p)) + '  ' + avgRating(p).toFixed(1) + ' (' + (S.reviews[p.id] || []).length + ' reviews)';
    raw('pd-price').textContent = '$' + money(p.price);
    raw('pd-desc').textContent = p.desc;
    var stockEl = raw('pd-stock'); stockEl.textContent = st.t; stockEl.className = 'stock ' + st.c;
    raw('pd-qty').textContent = S.pdQty;
    $('pd-add').disabled = p.stock === 0;
    $('pd-wish').textContent = S.wish[p.id] ? '♥ Saved' : '♡ Wishlist';
    $('pd-compare').textContent = S.compare.indexOf(p.id) >= 0 ? 'Remove from compare' : 'Compare';
    var rs = S.reviews[p.id] || [];
    var list = raw('review-list'); list.innerHTML = '';
    show('review-empty', rs.length === 0);
    rs.forEach(function (r) {
      var li = document.createElement('li');
      li.innerHTML = '<span class="who">' + r.author + '</span> <span class="rating">' + stars(r.rating) + '</span><br>' + r.text;
      list.appendChild(li);
    });
    raw('review-error').textContent = '';
  }
  BC.onRoute('product', function () { S.pdQty = 1; renderProduct(); });
  raw('pd-minus').addEventListener('click', function () { S.pdQty = Math.max(1, S.pdQty - 1); raw('pd-qty').textContent = S.pdQty; });
  raw('pd-plus').addEventListener('click', function () { S.pdQty += 1; raw('pd-qty').textContent = S.pdQty; });
  $('pd-add').addEventListener('click', function () { addToCart(S.pdId, S.pdQty); });
  $('pd-wish').addEventListener('click', function () { toggleWish(S.pdId); });
  $('pd-compare').addEventListener('click', function () { toggleCompare(S.pdId); });

  raw('review-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var text = $('review-text').value.trim();
    if (!S.user) { raw('review-error').textContent = 'Please log in to write a review.'; return; }
    if (text.length < 10) { raw('review-error').textContent = 'Review must be at least 10 characters.'; return; }
    (S.reviews[S.pdId] = S.reviews[S.pdId] || []).unshift({ author: S.user.name, rating: +$('review-rating').value, text: text });
    BC.save();
    $('review-text').value = '';
    BC.toast('Thanks for your review!');
    renderProduct(); renderProducts();
  });

  /* ---------- cart ---------- */
  function cartLines() { return Object.keys(S.cart).map(function (id) { return { p: byId(+id), qty: S.cart[id] }; }); }
  function totals() {
    var subtotal = cartLines().reduce(function (s, l) { return s + l.p.price * l.qty; }, 0);
    var discount = S.promo ? subtotal * BC.PROMOS[S.promo] : 0;
    var sel = $('ship-method');
    var onCheckout = !raw('view-checkout').classList.contains('hidden');
    var express = onCheckout && sel && sel.value === 'express';
    var shipping = subtotal === 0 ? 0 : (subtotal - discount >= 50 ? 0 : 4.5) + (express ? BC.EXPRESS_FEE : 0);
    return { subtotal: subtotal, discount: discount, shipping: shipping, total: subtotal - discount + shipping };
  }
  function addToCart(id, qty) {
    var p = byId(id);
    var have = S.cart[id] || 0;
    if (have + qty > p.stock) { BC.toast('Only ' + p.stock + ' of ' + p.name + ' in stock'); return; }
    S.cart[id] = have + qty;
    renderCart();
    BC.toast('Added ' + p.name + ' to cart');
  }
  function renderCart() {
    var lines = cartLines();
    var count = lines.reduce(function (s, l) { return s + l.qty; }, 0);
    $('cart-count').textContent = count;
    var list = raw('cart-items');
    list.innerHTML = '';
    show('cart-empty', lines.length === 0);
    lines.forEach(function (l) {
      var li = document.createElement('li');
      li.innerHTML = '<span class="ci-emoji">' + l.p.emoji + '</span><span class="ci-info">' + l.p.name + '<small>$' + money(l.p.price) + ' each</small></span>';
      var minus = document.createElement('button'); minus.className = 'qty-btn'; minus.textContent = '−'; minus.setAttribute('aria-label', 'Decrease ' + l.p.name);
      var q = document.createElement('span'); q.textContent = l.qty;
      var plus = document.createElement('button'); plus.className = 'qty-btn'; plus.textContent = '+'; plus.setAttribute('aria-label', 'Increase ' + l.p.name);
      var rm = document.createElement('button'); rm.className = 'remove-btn'; rm.textContent = 'Remove';
      minus.addEventListener('click', function () { S.cart[l.p.id] -= 1; if (S.cart[l.p.id] <= 0) { delete S.cart[l.p.id]; } renderCart(); });
      plus.addEventListener('click', function () { addToCart(l.p.id, 1); });
      rm.addEventListener('click', function () { delete S.cart[l.p.id]; renderCart(); });
      li.appendChild(minus); li.appendChild(q); li.appendChild(plus); li.appendChild(rm);
      list.appendChild(li);
    });
    var t = totals();
    raw('subtotal').textContent = money(t.subtotal);
    raw('discount').textContent = money(t.discount);
    raw('shipping').textContent = money(t.shipping);
    $('cart-total').textContent = money(t.total);
    $('checkout-btn').disabled = lines.length === 0;
  }
  function openCart(on) { show('cart-panel', on); show('overlay', on); }
  $('open-cart').addEventListener('click', function () { openCart(true); });
  $('close-cart').addEventListener('click', function () { openCart(false); });
  $('apply-promo').addEventListener('click', function () {
    var code = $('promo-input').value.trim().toUpperCase();
    var msg = raw('promo-msg');
    if (BC.PROMOS[code]) { S.promo = code; msg.textContent = 'Code ' + code + ' applied: 10% off'; msg.className = 'promo-msg ok'; }
    else { S.promo = null; msg.textContent = code ? 'Invalid promo code' : 'Enter a promo code'; msg.className = 'promo-msg bad'; }
    renderCart();
  });

  /* ---------- quick view ---------- */
  function openQuickView(id) {
    var p = byId(id);
    S.qvId = id; S.qvQty = 1;
    raw('qv-emoji').textContent = p.emoji;
    raw('qv-title').textContent = p.name;
    raw('qv-desc').textContent = p.desc;
    raw('qv-price').textContent = '$' + money(p.price);
    raw('qv-qty').textContent = 1;
    raw('qv-details').setAttribute('href', '#/product/' + p.id);
    show('quickview', true); show('overlay', true);
  }
  function closeQuickView() { show('quickview', false); show('overlay', false); }
  raw('qv-close').addEventListener('click', closeQuickView);
  raw('qv-details').addEventListener('click', closeQuickView);
  raw('qv-minus').addEventListener('click', function () { S.qvQty = Math.max(1, S.qvQty - 1); raw('qv-qty').textContent = S.qvQty; });
  raw('qv-plus').addEventListener('click', function () { S.qvQty += 1; raw('qv-qty').textContent = S.qvQty; });
  raw('qv-add').addEventListener('click', function () { addToCart(S.qvId, S.qvQty); closeQuickView(); });
  raw('overlay').addEventListener('click', function () { openCart(false); closeQuickView(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { openCart(false); closeQuickView(); } });

  /* ---------- search / sort / newsletter ---------- */
  $('search-input').addEventListener('input', function (e) {
    S.query = e.target.value;
    if ((window.location.hash || '#/') !== '#/') { BC.go('#/'); }
    renderProducts();
  });
  raw('sort-select').addEventListener('change', function (e) { S.sort = e.target.value; renderProducts(); });
  raw('newsletter-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var email = $('newsletter-email').value.trim();
    var msg = raw('newsletter-msg');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { msg.textContent = 'Please enter a valid email address.'; msg.className = 'promo-msg bad'; return; }
    msg.textContent = 'Subscribed! Use code BREW10 for 10% off.'; msg.className = 'promo-msg ok';
    $('newsletter-email').value = '';
  });

  BC.onRoute('home', function () { renderProducts(); });
  BC.onRoute('wishlist', renderWishlist);
  BC.onRoute('compare', renderCompare);

  BC.shop = { renderCart: renderCart, renderProducts: renderProducts, totals: totals, cartLines: cartLines, openCart: openCart, updateBadges: updateBadges };
  renderChips(); renderProducts(); renderCart(); updateBadges();
})(window.BC);
