/* Real dismiss actions; a real-time banner may naturally expire between visibility and tap. */
module.exports = async function dismissNotifications(page) {
  await page.bringToFront();
  const host=page.locator('#global-notifications'), touch=await page.evaluate(()=>navigator.maxTouchPoints>0);
  while (await host.isVisible()) {
    try {
      const close=page.locator('[data-dismiss-notification]');
      if(touch)await close.tap({timeout:4000});else await close.click({timeout:4000});
    } catch(error) {
      if(await host.isVisible())throw error;
    }
  }
};
