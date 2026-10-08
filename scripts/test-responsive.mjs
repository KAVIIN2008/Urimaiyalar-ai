import { chromium } from 'playwright';

const viewports = [
  { width: 320, height: 800, name: "Small Mobile" },
  { width: 375, height: 812, name: "Mobile" },
  { width: 390, height: 844, name: "Mobile Large" },
  { width: 414, height: 896, name: "Mobile Max" },
  { width: 768, height: 1024, name: "Tablet" },
  { width: 1024, height: 768, name: "Tablet Landscape" },
  { width: 1280, height: 720, name: "Laptop Small" },
  { width: 1366, height: 768, name: "Laptop Standard" },
  { width: 1440, height: 900, name: "Laptop Large" },
  { width: 1920, height: 1080, name: "Desktop" },
  { width: 2560, height: 1440, name: "Ultrawide" },
  { width: 3840, height: 2160, name: "4K TV" }
];

async function runTests() {
  console.log("Starting responsive test suite...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Set localStorage via context init
  await context.addInitScript(() => {
    // Inject a dummy token to bypass login
    window.localStorage.setItem('urimaiyalar_token', 'dummy_token');
    window.localStorage.setItem('hasSeenLanding', 'true');
    // The App.tsx will read these and think we're logged in.
    // Wait, App.tsx checks for token and role from backend, so it might redirect to login if dummy token fails API check.
  });

  for (const vp of viewports) {
    console.log(`\nTesting ${vp.name} (${vp.width}x${vp.height})...`);
    await page.setViewportSize({ width: vp.width, height: vp.height });
    
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // Check horizontal scroll
    const hasScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    
    if (hasScroll) {
      console.log(`❌ FAILED: Horizontal overflow detected at ${vp.width}px`);
    } else {
      console.log(`✅ PASS: No horizontal overflow at ${vp.width}px`);
    }
  }

  await browser.close();
  console.log("\nResponsive test suite complete.");
}

runTests().catch(console.error);
