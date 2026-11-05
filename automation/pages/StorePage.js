// Page object for the BrewCart demo store.
// Locators are the brittle, id-based ones on purpose: when the site is switched to
// ?v=2 the ids are renamed, and BrowserStack self-healing recovers them.
class StorePage {
  constructor(page) {
    this.page = page;
    this.openCart = page.locator('#open-cart');
    this.cartCount = page.locator('#cart-count');
    this.cartTotal = page.locator('#cart-total');
    this.checkoutButton = page.locator('#checkout-btn');
    this.fullName = page.locator('#full-name');
    this.email = page.locator('#email');
    this.address = page.locator('#address');
    this.card = page.locator('#card');
    this.placeOrder = page.locator('#place-order');
    this.orderId = page.locator('#order-id');
    this.confirmSummary = page.locator('#confirm-summary');
  }

  async goto(baseUrl) {
    await this.page.goto(baseUrl);
  }

  // Product add button is found via the product card (data-testid is stable in both versions).
  async addProductToCart(productName) {
    const card = this.page.locator('article.card', { hasText: productName });
    await card.getByRole('button', { name: 'Add to cart' }).click();
  }

  async fillCheckout(customer) {
    await this.fullName.fill(customer.fullName);
    await this.email.fill(customer.email);
    await this.address.fill(customer.address);
    await this.card.fill(customer.card);
  }
}

module.exports = { StorePage };
