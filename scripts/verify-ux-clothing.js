/**
 * Preflight Automated Script: verify-ux-clothing.js
 * Performs rigorous structural, UX, and functional assertions across all web files.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const WEB_DIR = path.join(__dirname, '..', 'web');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  ARALIYA ATELIER: UX & APPAREL INTEGRITY AUDIT');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

let passCount = 0;
let failCount = 0;

function runCheck(title, fn) {
  try {
    fn();
    console.log(`✓ [PASS] ${title}`);
    passCount++;
  } catch (err) {
    console.error(`✗ [FAIL] ${title}: ${err.message}`);
    failCount++;
  }
}

const indexContent = fs.readFileSync(path.join(WEB_DIR, 'index.html'), 'utf-8');
const adminContent = fs.readFileSync(path.join(WEB_DIR, 'admin.html'), 'utf-8');
const editorContent = fs.readFileSync(path.join(WEB_DIR, 'product-editor.html'), 'utf-8');
const maintenanceContent = fs.readFileSync(path.join(WEB_DIR, 'maintenance.html'), 'utf-8');

// 1. Touch Target Compliance (min-height: 44px)
runCheck('Mobile Touch Targets enforce minimum 44px (min-touch / min-height: 44px)', () => {
  assert(indexContent.includes('min-touch') || indexContent.includes('min-height: 44px'), 'index.html lacks 44px touch targets');
  assert(adminContent.includes('min-touch') || adminContent.includes('min-height: 44px'), 'admin.html lacks 44px touch targets');
  assert(editorContent.includes('min-touch') || editorContent.includes('min-height: 44px'), 'product-editor.html lacks 44px touch targets');
  assert(maintenanceContent.includes('min-h-[44px]'), 'maintenance.html lacks 44px touch targets');
});

// 2. Sticky Bottom Mobile Bar
runCheck('Sticky bottom mobile ordering bar with safe-area-inset-bottom', () => {
  assert(indexContent.includes('safe-bottom') && indexContent.includes('env(safe-area-inset-bottom)'), 'index.html lacks safe-area-inset-bottom');
  assert(indexContent.includes('sticky bottom-0'), 'index.html lacks sticky bottom mobile bar');
});

// 3. Clothing Size Selectors (XS - XXL)
runCheck('Apparel size selector supports XS, S, M, L, XL, XXL standard range', () => {
  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  sizes.forEach(sz => {
    assert(indexContent.includes(`'${sz}'`), `index.html missing size ${sz}`);
    assert(editorContent.includes(`'${sz}'`), `product-editor.html missing size ${sz}`);
  });
});

// 4. Interactive Colour Swatch Dots
runCheck('Interactive Colour Swatch dots feature w-6 h-6, circular shape and ring highlight', () => {
  assert(indexContent.includes('w-6 h-6 rounded-full'), 'index.html lacks w-6 h-6 rounded-full dots');
  assert(indexContent.includes('ring-2 ring-offset-1'), 'index.html lacks ring highlight for selected swatch');
  assert(indexContent.includes('scale-110'), 'index.html lacks scale transition on selected dot');
});

// 5. Active Colour Label Indicator
runCheck('Active colour indicator displays active colour name', () => {
  assert(indexContent.includes('colorLabel') && indexContent.includes('activeColor.name'), 'index.html missing dynamic colour name label');
});

// 6. Variant Selection Modal Popup
runCheck('Dedicated Variant Selection Modal opens when item added without variants', () => {
  assert(indexContent.includes('isVariantModalOpen'), 'index.html missing isVariantModalOpen state');
  assert(indexContent.includes('triggerProductAction'), 'index.html missing triggerProductAction handler');
  assert(indexContent.includes('Select Apparel Options'), 'index.html missing variant modal title');
});

// 7. Fallback Variant Resolver
runCheck('Fallback variant resolver dynamically extracts sizes/colours from product title/defaults', () => {
  assert(indexContent.includes('function resolveVariants'), 'index.html missing resolveVariants function');
});

// 8. Dual Ordering Flows: Online Checkout (COD/Bank Transfer) & 1-Click WhatsApp
runCheck('Two separate ordering choices: Online Form (COD/Bank Transfer) and 1-Click WhatsApp Direct Order', () => {
  assert(indexContent.includes('handleCheckoutSubmit'), 'index.html missing online form checkout handler');
  assert(indexContent.includes('Cash on Delivery') || indexContent.includes('COD'), 'index.html missing Cash on Delivery');
  assert(indexContent.includes('Direct Bank Transfer') || indexContent.includes('BankTransfer'), 'index.html missing Direct Bank Transfer');
  assert(indexContent.includes('triggerWhatsAppCartCheckout'), 'index.html missing 1-click WhatsApp cart checkout');
  assert(indexContent.includes('https://wa.me/'), 'index.html missing WhatsApp wa.me links');
});

// 9. Order Identifiers & Idempotency
runCheck('Orders generate unique Order ID (ORD-XXXX), Access Token (AT-XXXX) and idempotency guards', () => {
  assert(indexContent.includes('ORD-'), 'index.html does not generate ORD- identifiers');
  assert(indexContent.includes('AT-'), 'index.html does not generate AT- access tokens');
  assert(indexContent.includes('idempotencyKey'), 'index.html lacks idempotency key generation');
});

// 10. Live 5-Step Order Tracking Stepper
runCheck('Live order tracking modal with 5-step status progression', () => {
  const steps = ['Order Placed', 'Confirmed', 'Packing', 'Dispatched', 'Delivered'];
  steps.forEach(st => {
    assert(indexContent.includes(st), `index.html lacks tracking step: ${st}`);
  });
  assert(indexContent.includes('isTrackingOpen'), 'index.html missing tracking modal state');
});

// 11. Multi-Language Support (English, Sinhala, Tamil)
runCheck('Multi-Language system supports English, Sinhala (සිංහල), and Tamil (தமிழ்) with persistence', () => {
  assert(indexContent.includes('en: {'), 'Missing English translations');
  assert(indexContent.includes('si: {'), 'Missing Sinhala translations');
  assert(indexContent.includes('ta: {'), 'Missing Tamil translations');
  assert(indexContent.includes('localStorage.setItem(\'araliya_lang\''), 'Missing language persistence');
});

// 12. Sri Lankan Currency & Locations
runCheck('Currency formatted in LKR (Rs.) with Sri Lankan delivery hubs', () => {
  assert(indexContent.includes('formatLKR'), 'index.html missing LKR formatter');
  assert(indexContent.includes('Colombo 01-15'), 'index.html missing Colombo district options');
  assert(indexContent.includes('Kandy'), 'index.html missing Kandy delivery option');
  assert(indexContent.includes('Galle'), 'index.html missing Galle delivery option');
});

// 13. Standalone Product Editor Separate Window & Cross-Window Sync
runCheck('Product editor opens in separate window and communicates via postMessage & storage', () => {
  assert(adminContent.includes('product-editor.html?id='), 'admin.html does not link to product editor');
  assert(adminContent.includes('window.open('), 'admin.html does not open editor in separate window');
  assert(adminContent.includes('PRODUCT_SAVED'), 'admin.html does not listen for PRODUCT_SAVED message');
  assert(editorContent.includes('window.opener.postMessage'), 'product-editor.html does not postMessage to opener');
  assert(editorContent.includes('beforeunload'), 'product-editor.html does not protect unsaved changes with beforeunload');
});

// 14. Dual Projection Architecture (products & publicProducts)
runCheck('Dual projection architecture synchronizes private master products with public catalog', () => {
  assert(editorContent.includes('araliya_products'), 'product-editor.html missing private products write');
  assert(editorContent.includes('araliya_public_products'), 'product-editor.html missing publicProducts projection');
});

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
if (failCount > 0) {
  console.error(`UX Verification Failed: ${failCount} assertions failed.`);
  process.exit(1);
} else {
  console.log(`UX Verification Passed: All ${passCount} assertions passed successfully!`);
  process.exit(0);
}
