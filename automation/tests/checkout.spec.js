const { test, expect } = require('@playwright/test');
const { StorePage } = require('../pages/StorePage');
const data = require('../data/checkout.json');

// The target URL is set once in playwright.config.js (the GitHub Pages site).
// Use the "v2" npm scripts to run the same test on the redesigned UI (?v=2).
test('guest can add a product, apply a promo and complete a 3-step checkout', async ({ page, baseURL }) => {
  const store = new StorePage(page);

  await store.goto(baseURL);
  await store.addProductToCart(data.product);
  await expect(store.cartCount).toHaveText('1');

  await store.openCart.click();
  await store.applyPromoCode(data.promoCode);
  await expect(store.promoMsg).toContainText('applied');
  await expect(store.cartTotal).toHaveText(data.expectedTotal);
  await store.checkoutButton.click();

  await store.fillShipping(data.customer);
  await store.fillPayment(data.customer);
  await store.terms.check();
  await store.placeOrder.click();

  await expect(page.getByRole('heading', { name: 'Thank you for your order!' })).toBeVisible();
  await expect(store.orderId).toHaveText(/^BC-\d{6}$/);
  await expect(store.confirmSummary).toContainText(`total $${data.expectedTotal}`);
  await expect(store.confirmSummary).toContainText(data.customer.email);
});
