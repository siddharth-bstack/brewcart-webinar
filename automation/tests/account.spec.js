const { test, expect } = require('@playwright/test');
const { StorePage } = require('../pages/StorePage');
const { AccountPage } = require('../pages/AccountPage');
const data = require('../data/checkout.json');

// Workflow 2: a new customer signs up, reviews a product, saves and compares it,
// then buys something and finds the order in their order history.
test('new customer signs up, reviews a product, and sees their order in history', async ({ page, baseURL }) => {
  const store = new StorePage(page);
  const account = new AccountPage(page);
  // Unique email per run so the test is repeatable (accounts persist in the browser only).
  const user = {
    fullName: data.account.fullName,
    password: data.account.password,
    email: `jane.${Date.now()}@example.com`,
  };

  await store.goto(baseURL);

  // --- sign up ---
  await account.signUp(user);
  await expect(account.accountTitle).toHaveText(`Hi, ${user.fullName}`);
  await expect(account.accountEmail).toHaveText(user.email);
  await expect(account.accountLabel).toHaveText('Jane');

  // --- review, wishlist and compare a product ---
  await page.getByRole('link', { name: 'Shop', exact: true }).click();
  await account.openProduct(data.review.product);
  await expect(account.pdTitle).toHaveText(data.review.product);
  await account.writeReview(data.review.rating, data.review.text);
  await expect(account.reviewItems).toHaveCount(1);
  await expect(account.reviewItems.first()).toContainText(data.review.text);
  await account.pdWish.click();
  await expect(account.wishlistCount).toHaveText('1');
  await account.pdCompare.click();
  await expect(account.compareCount).toHaveText('1');

  // --- buy something, details are prefilled from the account ---
  await page.getByRole('link', { name: 'Shop', exact: true }).click();
  await store.addProductToCart(data.product);
  await store.openCart.click();
  await store.checkoutButton.click();
  await expect(store.fullName).toHaveValue(user.fullName);
  await expect(store.email).toHaveValue(user.email);
  await store.address.fill(data.customer.address);
  await store.city.fill(data.customer.city);
  await store.nextButton.click();
  await store.fillPayment(data.customer);
  await store.terms.check();
  await store.placeOrder.click();
  await expect(store.orderId).toHaveText(/^BC-\d{6}$/);
  const orderNumber = await store.orderId.innerText();

  // --- order shows up in the account ---
  await page.getByRole('link', { name: 'View my orders' }).click();
  await expect(account.orderRows).toHaveCount(1);
  await expect(account.orderRows.first()).toContainText(orderNumber);
  await expect(account.orderRows.first()).toContainText('Processing');

  // --- log out ---
  await account.logoutButton.click();
  await expect(account.accountLabel).toHaveText('Sign in');
});
