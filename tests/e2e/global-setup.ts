import { chromium, FullConfig } from '@playwright/test';

/**
 * Global setup for E2E tests
 * 
 * This runs before all tests to:
 * - Verify test environment is ready
 * - Set up test data if needed
 * - Authenticate and store session state
 */

async function globalSetup(config: FullConfig) {
  const { baseURL } = config.projects[0].use;
  
  console.log('🔧 E2E Global Setup');
  console.log(`   Base URL: ${baseURL}`);
  
  // Verify server is running
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    await page.goto(baseURL || 'http://localhost:5173', { timeout: 30000 });
    console.log('✅ Server is running');
  } catch (error) {
    console.error('❌ Server is not running. Please start the dev server:');
    console.error('   npm run dev');
    throw error;
  }
  
  await browser.close();
  
  console.log('✅ Global setup complete');
}

export default globalSetup;

