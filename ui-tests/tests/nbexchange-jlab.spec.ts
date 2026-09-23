import { expect, test } from '@jupyterlab/galata';

/**
 * Basic E2E test for nbexchange-jlab extension.
 *
 * Comprehensive testing is done via:
 * - Python unit tests: nbexchange_jlab/tests/test_feature_status.py (33 tests)
 * - TypeScript unit tests: src/__tests__/featureStatus.spec.ts (13 tests)
 */
test.use({ autoGoto: false });

test('should load JupyterLab successfully', async ({ page }) => {
  await page.goto();
  await page.waitForSelector('#jp-main-dock-panel', { timeout: 10000 });

  const dockPanel = await page.$('#jp-main-dock-panel');
  expect(dockPanel).toBeTruthy();
});
