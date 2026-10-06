/* Real dismiss taps for non-notification regressions whose simulated clock is paused. */
module.exports = async function dismissNotifications(page) {
  while (await page.locator('#global-notifications').isVisible())
    await page.locator('[data-dismiss-notification]').tap();
};
