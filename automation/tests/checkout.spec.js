const { test, expect } = require('@playwright/test');
const { StorePage } = require('../pages/StorePage');
const data = require('../data/checkout.json');

// BASE_URL points at the deployed GitHub Pages site (or a local server).
// Append ?v=2 to simulate the redesigned UI whose locators changed.
const BASE_URL = process.env.BASE_URL;

test('guest can add a product to the cart and complete checkout', async ({ page }) => {
  expect(BASE_URL, 'BASE_URL env var must be set').toBeTruthy();
  const store = new StorePage(page);

  await store.goto(BASE_URL);
  await store.addProductToCart(data.product);
  await expect(store.cartCount).toHaveText('1');

  await store.openCart.click();
  await expect(store.cartTotal).toHaveText(data.productPrice);
  await store.checkoutButton.click();

  await store.fillCheckout(data.customer);
  await store.placeOrder.click();

  await expect(page.getByRole('heading', { name: 'Thank you for your order!' })).toBeVisible();
  await expect(store.orderId).toHaveText(/^BC-\d{6}$/);
  await expect(store.confirmSummary).toContainText(`total $${data.productPrice}`);
  await expect(store.confirmSummary).toContainText(data.customer.email);
});
