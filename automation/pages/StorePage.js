// Page object for the BrewCart store: catalogue, cart and 3-step checkout.
// Locators are the brittle id-based ones on purpose: on the "v2" UI the ids are renamed,
// and BrowserStack self-healing recovers them from visible text / role / position.
class StorePage {
  constructor(page) {
    this.page = page;
    this.openCart = page.locator('#open-cart');
    this.cartCount = page.locator('#cart-count');
    this.cartTotal = page.locator('#cart-total');
    this.promoInput = page.locator('#promo-input');
    this.applyPromo = page.locator('#apply-promo');
    this.promoMsg = page.locator('#promo-msg');
    this.checkoutButton = page.locator('#checkout-btn');

    this.fullName = page.locator('#full-name');
    this.email = page.locator('#email');
    this.address = page.locator('#address');
    this.city = page.locator('#city');
    this.cardName = page.locator('#card-name');
    this.card = page.locator('#card');
    this.expiry = page.locator('#expiry');
    this.cvv = page.locator('#cvv');
    this.terms = page.locator('#terms');
    this.nextButton = page.locator('#next-btn');
    this.placeOrder = page.locator('#place-order');

    this.orderId = page.locator('#order-id');
    this.confirmSummary = page.locator('#confirm-summary');
  }

  async goto(url) {
    await this.page.goto(url);
  }

  // Add button is found inside the product card by role+name, stable across both UI versions.
  async addProductToCart(productName) {
    const card = this.page.locator('article.card', { hasText: productName });
    await card.getByRole('button', { name: 'Add to cart' }).click();
  }

  async applyPromoCode(code) {
    await this.promoInput.fill(code);
    await this.applyPromo.click();
  }

  async fillShipping(c) {
    await this.fullName.fill(c.fullName);
    await this.email.fill(c.email);
    await this.address.fill(c.address);
    await this.city.fill(c.city);
    await this.nextButton.click();
  }

  async fillPayment(c) {
    await this.cardName.fill(c.fullName);
    await this.card.fill(c.card);
    await this.expiry.fill(c.expiry);
    await this.cvv.fill(c.cvv);
    await this.nextButton.click();
  }
}

module.exports = { StorePage };
