// Page object for the BrewCart account area: sign up, log in/out, product page, wishlist, compare, orders.
// Id-based locators on purpose (renamed in the "v2" UI, recovered by self-healing).
class AccountPage {
  constructor(page) {
    this.page = page;
    this.accountLink = page.locator('#nav-account');
    this.accountLabel = page.locator('#account-label');
    this.tabSignup = page.locator('#tab-signup');
    this.tabLogin = page.locator('#tab-login');

    this.signupName = page.locator('#signup-name');
    this.signupEmail = page.locator('#signup-email');
    this.signupPassword = page.locator('#signup-password');
    this.signupConfirm = page.locator('#signup-confirm');
    this.signupTerms = page.locator('#signup-terms');
    this.signupSubmit = page.locator('#signup-submit');
    this.signupError = page.locator('#signup-error');

    this.loginEmail = page.locator('#login-email');
    this.loginPassword = page.locator('#login-password');
    this.loginSubmit = page.locator('#login-submit');
    this.loginError = page.locator('#login-error');

    this.accountTitle = page.locator('#account-title');
    this.accountEmail = page.locator('#account-email');
    this.logoutButton = page.locator('#logout-btn');
    this.ordersTable = page.locator('#orders-table');
    this.orderRows = page.locator('#orders-body tr');

    this.pdTitle = page.locator('#pd-title');
    this.pdWish = page.locator('#pd-wish');
    this.pdCompare = page.locator('#pd-compare');
    this.reviewRating = page.locator('#review-rating');
    this.reviewText = page.locator('#review-text');
    this.reviewSubmit = page.locator('#review-submit');
    this.reviewError = page.locator('#review-error');
    this.reviewItems = page.locator('#review-list li');

    this.wishlistButton = page.locator('#wishlist-btn');
    this.wishlistCount = page.locator('#wishlist-count');
    this.compareCount = page.locator('#compare-count');
    this.wishlistItems = page.locator('#wishlist-list li');
    this.compareTable = page.locator('#compare-table');
  }

  async signUp(user) {
    await this.accountLink.click();
    await this.tabSignup.click();
    await this.signupName.fill(user.fullName);
    await this.signupEmail.fill(user.email);
    await this.signupPassword.fill(user.password);
    await this.signupConfirm.fill(user.password);
    await this.signupTerms.check();
    await this.signupSubmit.click();
  }

  async logIn(user) {
    await this.accountLink.click();
    await this.loginEmail.fill(user.email);
    await this.loginPassword.fill(user.password);
    await this.loginSubmit.click();
  }

  // Opens a product detail page by clicking its title link in the catalogue.
  async openProduct(productName) {
    await this.page.getByRole('link', { name: productName, exact: true }).click();
  }

  async writeReview(rating, text) {
    await this.reviewRating.selectOption(String(rating));
    await this.reviewText.fill(text);
    await this.reviewSubmit.click();
  }
}

module.exports = { AccountPage };
