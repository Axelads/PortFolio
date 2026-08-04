const puppeteer = require('puppeteer');

(async () => {
  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 1024 });
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForTimeout(2000);
    const screenshotPath = 'c:\Users\profe\Documents\Portefolio\screenshot.png';
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log('Screenshot saved to: ' + screenshotPath);
    await browser.close();
  } catch (error) {
    console.error('Error taking screenshot:', error.message);
    process.exit(1);
  }
})();
