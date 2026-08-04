import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

(async () => {
  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 1200 });
    
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 60000 });
    await new Promise(r => setTimeout(r, 10000));
    
    // Scroll to show informations section prominently
    await page.evaluate(() => {
      const elem = document.querySelector('.informations');
      if (elem) {
        const rect = elem.getBoundingClientRect();
        const scrollTarget = window.scrollY + rect.top - 200;
        window.scrollTo(0, scrollTarget);
      }
    });
    
    await new Promise(r => setTimeout(r, 1000));
    
    const screenshotPath = path.join(__dirname, '..', 'screenshot-informations-liquid.png');
    await page.screenshot({ path: screenshotPath, fullPage: false });
    console.log('Screenshot saved: ' + screenshotPath);
    
    await browser.close();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
