const { test, expect, request } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

// ========== CONFIGURATION ==========
const config = {
  baseURL: 'https://stage-api.ecarehealth.com',
  tenantId: 'stage_aithinkitive',
  credentials: { username: 'rose.gomez@jourrapide.com', password: 'Pass@123' },
  accessToken: 'YOUR_ACCESS_TOKEN_HERE'
};

// ========== UTILITY FUNCTIONS ==========
const generateRandomString = (length) => {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};
const generateRandomEmail = () => `test.${generateRandomString(8)}@mailinator.com`;
const generateRandomPhone = () => `9${Math.floor(Math.random() * 900000000) + 100000000}`;

// ========== SAFE JSON PARSE ==========
async function safeJson(response) {
  try {
    const text = await response.text();
    return text ? JSON.parse(text) : {};
  } catch (e) {
    return { error: 'Invalid JSON', raw: await response.text() };
  }
}

// ========== HTML REPORT STRUCTURE ==========
let testReport = {
  testSuite: 'eCareHealth API Test Suite',
  startTime: new Date().toISOString(),
  endTime: null,
  totalTests: 0,
  passed: 0,
  failed: 0,
  tests: []
};

function addTestResult(testName, status, details, request, response) {
  const testResult = {
    name: testName,
    status,
    timestamp: new Date().toISOString(),
    details,
    request: {
      method: request.method,
      url: request.url,
      headers: request.headers,
      body: request.body
    },
    response
  };
  testReport.tests.push(testResult);
  testReport.totalTests++;
  if (status === 'PASSED') testReport.passed++;
  else testReport.failed++;
}

function generateHTMLReport(report) {
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${report.testSuite}</title><style>
    body { font-family: Arial; background: #f2f2f2; padding: 20px; }
    .container { background: white; padding: 20px; border-radius: 8px; max-width: 1200px; margin: auto; }
    .header { text-align: center; margin-bottom: 20px; }
    .summary { display: flex; justify-content: space-around; margin-bottom: 30px; }
    .summary-card { padding: 10px; border-radius: 5px; background: #eee; text-align: center; }
    .value { font-size: 24px; font-weight: bold; }
    .passed { color: green; }
    .failed { color: red; }
    .test { border: 1px solid #ccc; margin-bottom: 10px; border-radius: 5px; overflow: hidden; }
    .test-header { padding: 10px; background: #ddd; cursor: pointer; display: flex; justify-content: space-between; }
    .test-status { font-weight: bold; }
    .status-passed { color: green; }
    .status-failed { color: red; }
    .test-details { display: none; padding: 10px; background: #fafafa; }
    .test-details.active { display: block; }
    pre { background: #f0f0f0; padding: 10px; overflow-x: auto; }
    .footer { margin-top: 40px; font-size: 14px; text-align: center; color: #777; }
    .expandable-arrow { float: right; transition: transform 0.3s; }
    .expandable-arrow.expanded { transform: rotate(90deg); }
  </style></head><body><div class="container">
    <div class="header"><h1>${report.testSuite}</h1><p>Test Execution Report</p></div>
    <div class="summary">
      <div class="summary-card"><h3>Total Tests</h3><div class="value total">${report.totalTests}</div></div>
      <div class="summary-card"><h3>Passed</h3><div class="value passed">${report.passed}</div></div>
      <div class="summary-card"><h3>Failed</h3><div class="value failed">${report.failed}</div></div>
      <div class="summary-card"><h3>Success Rate</h3><div class="value total">${report.totalTests>0?((report.passed/report.totalTests)*100).toFixed(1):0}%</div></div>
    </div>
    <div class="tests"><h2>Test Results</h2>
      ${report.tests.map((t,i)=>`<div class="test">
        <div class="test-header" onclick="toggleDetails(${i})"><span class="test-name">${t.name}<span class="expandable-arrow" id="arrow-${i}">▶</span></span><span class="test-status status-${t.status.toLowerCase()}">${t.status}</span></div>
        <div class="test-details" id="details-${i}">
          <div class="detail-section"><h4>Details</h4><p>${t.details}</p><p class="timestamp">${new Date(t.timestamp).toLocaleString()}</p></div>
          <div class="detail-section"><h4>Request</h4><pre>Method: ${t.request.method}\nURL: ${t.request.url}\nHeaders: ${JSON.stringify(t.request.headers,null,2)}\nBody: ${t.request.body?JSON.stringify(t.request.body,null,2):'N/A'}</pre></div>
          <div class="detail-section"><h4>Response</h4><pre>Status: ${t.response.status} ${t.response.statusText}\nHeaders: ${JSON.stringify(t.response.headers,null,2)}\nBody: ${JSON.stringify(t.response.body,null,2)}</pre></div>
        </div>
      </div>`).join('')}</div>
    <div class="footer"><p>Started at: ${new Date(report.startTime).toLocaleString()}</p><p>Completed at: ${new Date(report.endTime).toLocaleString()}</p><p>Duration: ${((new Date(report.endTime)-new Date(report.startTime))/1000).toFixed(2)} seconds</p></div>
  </div><script>function toggleDetails(i){const d=document.getElementById('details-'+i),a=document.getElementById('arrow-'+i);d.classList.toggle('active');a.classList.toggle('expanded')}</script></body></html>`;
  const reportPath = path.join(__dirname, 'test-report.html');
  fs.writeFileSync(reportPath, html);
  console.log(`✅ Test report generated: ${reportPath}`);
  console.log(`📊 Total: ${report.totalTests}, Passed: ${report.passed}, Failed: ${report.failed}`);
}

// ========== MAIN TEST SUITE ==========
test.describe('eCareHealth API Test Suite', () => {
  let context;
  let providerId;
  let patientId;

  const providerData = {
    firstName: `Test${generateRandomString(5)}`,
    lastName: `Provider${generateRandomString(5)}`,
    email: generateRandomEmail(),
    phone: generateRandomPhone()
  };

  const patientData = {
    firstName: `Patient${generateRandomString(5)}`,
    lastName: `Test${generateRandomString(5)}`,
    birthDate: '1990-01-01T00:00:00.000Z'
  };

  test.beforeAll(async () => {
    context = await request.newContext({
      baseURL: config.baseURL,
      extraHTTPHeaders: {
        'X-TENANT-ID': config.tenantId,
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/plain, */*',
        'Authorization': `Bearer ${config.accessToken}`
      }
    });
  });

  test.afterAll(async () => {
    await context.dispose();
    testReport.endTime = new Date().toISOString();
    generateHTMLReport(testReport);
  });

  test('Add Provider API', async () => {
    // implementation from previous step
  });

  test('Get Provider API', async () => {
    // implementation from previous step
  });

  test('Set Availability API', async () => {
    // implementation from previous step
  });

  test('Get Availability API', async () => {
    // new implementation added in previous message
  });

  test('Create Patient API', async () => {
    // implementation from previous step
  });

  test('Book Appointment API', async () => {
    // implementation from previous step
  });
});
