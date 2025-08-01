const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

// Test configuration
const BASE_URL = 'https://stage-api.ecarehealth.com';
const TENANT_ID = 'stage_aithinkitive';

// Test data storage
let testContext = {
  accessToken: '',
  providerId: '',
  patientId: '',
  testResults: []
};

// Utility functions
function generateRandomString(length = 8) {
  return Math.random().toString(36).substring(2, length + 2);
}

function generateRandomEmail() {
  return `test.user+${generateRandomString()}@example.com`;
}

function generateRandomPhone() {
  return `555${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}`;
}

function generateTestProvider() {
  const firstName = `Test${generateRandomString(5)}`;
  const lastName = `Provider${generateRandomString(5)}`;
  
  return {
    roleType: "PROVIDER",
    active: false,
    admin_access: true,
    status: false,
    avatar: "",
    role: "PROVIDER",
    firstName: firstName,
    lastName: lastName,
    gender: "MALE",
    phone: "",
    npi: "",
    specialities: null,
    groupNpiNumber: "",
    licensedStates: null,
    licenseNumber: "",
    acceptedInsurances: null,
    experience: "",
    taxonomyNumber: "",
    workLocations: null,
    email: generateRandomEmail(),
    officeFaxNumber: "",
    areaFocus: "",
    hospitalAffiliation: "",
    ageGroupSeen: null,
    spokenLanguages: null,
    providerEmployment: "",
    insurance_verification: "",
    prior_authorization: "",
    secondOpinion: "",
    careService: null,
    bio: "",
    expertise: "",
    workExperience: "",
    licenceInformation: [{
      uuid: "",
      licenseState: "",
      licenseNumber: ""
    }],
    deaInformation: [{
      deaState: "",
      deaNumber: "",
      deaTermDate: "",
      deaActiveDate: ""
    }]
  };
}

function generateTestPatient() {
  const firstName = `Test${generateRandomString(5)}`;
  const lastName = `Patient${generateRandomString(5)}`;
  const birthDate = new Date(1990 + Math.floor(Math.random() * 30), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28));
  
  return {
    phoneNotAvailable: true,
    emailNotAvailable: true,
    registrationDate: "",
    firstName: firstName,
    middleName: "",
    lastName: lastName,
    timezone: "IST",
    birthDate: birthDate.toISOString(),
    gender: Math.random() > 0.5 ? "MALE" : "FEMALE",
    ssn: "",
    mrn: "",
    languages: null,
    avatar: "",
    mobileNumber: "",
    faxNumber: "",
    homePhone: "",
    address: {
      line1: "",
      line2: "",
      city: "",
      state: "",
      country: "",
      zipcode: ""
    },
    emergencyContacts: [{
      firstName: "",
      lastName: "",
      mobile: ""
    }],
    patientInsurances: [{
      active: true,
      insuranceId: "",
      copayType: "FIXED",
      coInsurance: "",
      claimNumber: "",
      note: "",
      deductibleAmount: "",
      employerName: "",
      employerAddress: {
        line1: "",
        line2: "",
        city: "",
        state: "",
        country: "",
        zipcode: ""
      },
      subscriberFirstName: "",
      subscriberLastName: "",
      subscriberMiddleName: "",
      subscriberSsn: "",
      subscriberMobileNumber: "",
      subscriberAddress: {
        line1: "",
        line2: "",
        city: "",
        state: "",
        country: "",
        zipcode: ""
      },
      groupId: "",
      memberId: "",
      groupName: "",
      frontPhoto: "",
      backPhoto: "",
      insuredFirstName: "",
      insuredLastName: "",
      address: {
        line1: "",
        line2: "",
        city: "",
        state: "",
        country: "",
        zipcode: ""
      },
      insuredBirthDate: "",
      coPay: "",
      insurancePayer: {}
    }],
    emailConsent: false,
    messageConsent: false,
    callConsent: false,
    patientConsentEntities: [{
      signedDate: new Date().toISOString()
    }]
  };
}

function addTestResult(testName, status, details) {
  testContext.testResults.push({
    testName,
    status,
    details,
    timestamp: new Date().toISOString()
  });
}

// Test suite
test.describe('eCareHealth API Test Suite', () => {
  test.beforeAll(async ({ request }) => {
    console.log('Starting eCareHealth API Test Suite...');
  });

  test.afterAll(async () => {
    // Generate test report
    generateTestReport();
  });

  test('1. Provider Login API', async ({ request }) => {
    const testName = 'Provider Login API';
    console.log(`\nExecuting: ${testName}`);

    try {
      const response = await request.post(`${BASE_URL}/api/master/login`, {
        headers: {
          'Content-Type': 'application/json',
          'X-TENANT-ID': TENANT_ID
        },
        data: {
          username: "rose.gomez@jourrapide.com",
          password: "Pass@123",
          xTENANTID: TENANT_ID
        }
      });

      // Validate status code
      expect(response.status()).toBe(200);
      console.log(`✓ Status Code: ${response.status()}`);

      const responseBody = await response.json();
      
      // Extract and store access token
      expect(responseBody).toHaveProperty('access_token');
      testContext.accessToken = responseBody.access_token;
      console.log(`✓ Access token extracted successfully`);

      addTestResult(testName, 'PASSED', {
        statusCode: response.status(),
        tokenExtracted: true,
        message: 'Login successful and token extracted'
      });

    } catch (error) {
      console.error(`✗ ${testName} failed:`, error.message);
      addTestResult(testName, 'FAILED', {
        error: error.message
      });
      throw error;
    }
  });

  test('2. Add Provider API', async ({ request }) => {
    const testName = 'Add Provider API';
    console.log(`\nExecuting: ${testName}`);

    const providerData = generateTestProvider();
    console.log(`Generated provider: ${providerData.firstName} ${providerData.lastName}`);

    try {
      const response = await request.post(`${BASE_URL}/api/master/provider`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testContext.accessToken}`,
          'X-TENANT-ID': TENANT_ID
        },
        data: providerData
      });

      // Validate status code
      expect(response.status()).toBe(201);
      console.log(`✓ Status Code: ${response.status()}`);

      const responseBody = await response.json();
      
      // Validate response message
      expect(responseBody.message).toBe('Provider created successfully.');
      console.log(`✓ Response message validated`);

      // Store provider name for later use
      testContext.providerName = `${providerData.firstName} ${providerData.lastName}`;

      addTestResult(testName, 'PASSED', {
        statusCode: response.status(),
        message: responseBody.message,
        providerName: testContext.providerName
      });

    } catch (error) {
      console.error(`✗ ${testName} failed:`, error.message);
      addTestResult(testName, 'FAILED', {
        error: error.message
      });
      throw error;
    }
  });

  test('3. Get Provider API', async ({ request }) => {
    const testName = 'Get Provider API';
    console.log(`\nExecuting: ${testName}`);

    try {
      const response = await request.get(`${BASE_URL}/api/master/provider`, {
        headers: {
          'Authorization': `Bearer ${testContext.accessToken}`,
          'X-TENANT-ID': TENANT_ID
        },
        params: {
          page: 0,
          size: 20
        }
      });

      // Validate status code
      expect(response.status()).toBe(200);
      console.log(`✓ Status Code: ${response.status()}`);

      const responseBody = await response.json();
      
      // Find the created provider
      const createdProvider = responseBody.rows.find(provider => 
        `${provider.firstName} ${provider.lastName}` === testContext.providerName
      );
      
      expect(createdProvider).toBeTruthy();
      console.log(`✓ Created provider found in response`);

      // Extract provider UUID
      testContext.providerId = createdProvider.uuid;
      console.log(`✓ Provider UUID extracted: ${testContext.providerId}`);

      addTestResult(testName, 'PASSED', {
        statusCode: response.status(),
        providerFound: true,
        providerId: testContext.providerId
      });

    } catch (error) {
      console.error(`✗ ${testName} failed:`, error.message);
      addTestResult(testName, 'FAILED', {
        error: error.message
      });
      throw error;
    }
  });

  test('4. Set Availability API', async ({ request }) => {
    const testName = 'Set Availability API';
    console.log(`\nExecuting: ${testName}`);

    // Calculate next Monday at 12:00 PM
    const getNextMonday = () => {
      const today = new Date();
      const daysUntilMonday = (8 - today.getDay()) % 7 || 7;
      const nextMonday = new Date(today);
      nextMonday.setDate(today.getDate() + daysUntilMonday);
      return nextMonday;
    };

    try {
      const response = await request.post(`${BASE_URL}/api/master/provider/availability-setting`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testContext.accessToken}`,
          'X-TENANT-ID': TENANT_ID
        },
        data: {
          setToWeekdays: false,
          providerId: testContext.providerId,
          bookingWindow: "3",
          timezone: "EST",
          bufferTime: 0,
          initialConsultTime: 0,
          followupConsultTime: 0,
          settings: [{
            type: "NEW",
            slotTime: "30",
            minNoticeUnit: "8_HOUR"
          }],
          blockDays: [],
          daySlots: [{
            day: "MONDAY",
            startTime: "12:00:00",
            endTime: "13:00:00",
            availabilityMode: "VIRTUAL"
          }],
          bookBefore: "undefined undefined",
          xTENANTID: TENANT_ID
        }
      });

      // Validate status code
      expect(response.status()).toBe(200);
      console.log(`✓ Status Code: ${response.status()}`);

      const responseBody = await response.json();
      
      // Validate response message
      const expectedMessage = `Availability added successfully for provider ${testContext.providerName}`;
      expect(responseBody.message).toBe(expectedMessage);
      console.log(`✓ Response message validated`);

      addTestResult(testName, 'PASSED', {
        statusCode: response.status(),
        message: responseBody.message
      });

    } catch (error) {
      console.error(`✗ ${testName} failed:`, error.message);
      addTestResult(testName, 'FAILED', {
        error: error.message
      });
      throw error;
    }
  });

  test('5. Create Patient API', async ({ request }) => {
    const testName = 'Create Patient API';
    console.log(`\nExecuting: ${testName}`);

    const patientData = generateTestPatient();
    console.log(`Generated patient: ${patientData.firstName} ${patientData.lastName}`);

    try {
      const response = await request.post(`${BASE_URL}/api/master/patient`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testContext.accessToken}`,
          'X-TENANT-ID': TENANT_ID
        },
        data: patientData
      });

      // Validate status code
      expect(response.status()).toBe(201);
      console.log(`✓ Status Code: ${response.status()}`);

      const responseBody = await response.json();
      
      // Validate response message
      expect(responseBody.message).toBe('Patient Details Added Successfully.');
      console.log(`✓ Response message validated`);

      // Store patient name for later use
      testContext.patientName = `${patientData.firstName} ${patientData.lastName}`;

      addTestResult(testName, 'PASSED', {
        statusCode: response.status(),
        message: responseBody.message,
        patientName: testContext.patientName
      });

    } catch (error) {
      console.error(`✗ ${testName} failed:`, error.message);
      addTestResult(testName, 'FAILED', {
        error: error.message
      });
      throw error;
    }
  });

  test('6. Get Patient API', async ({ request }) => {
    const testName = 'Get Patient API';
    console.log(`\nExecuting: ${testName}`);

    try {
      const response = await request.get(`${BASE_URL}/api/master/patient`, {
        headers: {
          'Authorization': `Bearer ${testContext.accessToken}`,
          'X-TENANT-ID': TENANT_ID
        },
        params: {
          page: 0,
          size: 20,
          searchString: ''
        }
      });

      // Validate status code
      expect(response.status()).toBe(200);
      console.log(`✓ Status Code: ${response.status()}`);

      const responseBody = await response.json();
      
      // Find the created patient
      const createdPatient = responseBody.rows.find(patient => 
        `${patient.firstName} ${patient.lastName}` === testContext.patientName
      );
      
      expect(createdPatient).toBeTruthy();
      console.log(`✓ Created patient found in response`);

      // Extract patient UUID
      testContext.patientId = createdPatient.uuid;
      console.log(`✓ Patient UUID extracted: ${testContext.patientId}`);

      addTestResult(testName, 'PASSED', {
        statusCode: response.status(),
        patientFound: true,
        patientId: testContext.patientId
      });

    } catch (error) {
      console.error(`✗ ${testName} failed:`, error.message);
      addTestResult(testName, 'FAILED', {
        error: error.message
      });
      throw error;
    }
  });

  test('7. Book Appointment API', async ({ request }) => {
    const testName = 'Book Appointment API';
    console.log(`\nExecuting: ${testName}`);

    // Calculate next Monday at 12:00 PM
    const getNextMondayAppointment = () => {
      const today = new Date();
      const daysUntilMonday = (8 - today.getDay()) % 7 || 7;
      const nextMonday = new Date(today);
      nextMonday.setDate(today.getDate() + daysUntilMonday);
      nextMonday.setHours(17, 0, 0, 0); // 5:00 PM UTC (12:00 PM EST)
      return nextMonday;
    };

    const appointmentDate = getNextMondayAppointment();
    const startTime = appointmentDate.toISOString();
    const endTime = new Date(appointmentDate.getTime() + 30 * 60000).toISOString(); // 30 minutes later

    try {
      const response = await request.post(`${BASE_URL}/api/master/appointment`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testContext.accessToken}`,
          'X-TENANT-ID': TENANT_ID
        },
        data: {
          mode: "VIRTUAL",
          patientId: testContext.patientId,
          customForms: null,
          visit_type: "",
          type: "NEW",
          paymentType: "CASH",
          providerId: testContext.providerId,
          startTime: startTime,
          endTime: endTime,
          insurance_type: "",
          note: "",
          authorization: "",
          forms: [],
          chiefComplaint: "API test appointment",
          isRecurring: false,
          recurringFrequency: "daily",
          reminder_set: false,
          endType: "never",
          endDate: new Date().toISOString(),
          endAfter: 5,
          customFrequency: 1,
          customFrequencyUnit: "days",
          selectedWeekdays: [],
          reminder_before_number: 1,
          timezone: "CST",
          duration: 30,
          xTENANTID: TENANT_ID
        }
      });

      // Validate status code
      expect(response.status()).toBe(200);
      console.log(`✓ Status Code: ${response.status()}`);

      const responseBody = await response.json();
      
      // Validate response message
      expect(responseBody.message).toBe('Appointment booked successfully.');
      console.log(`✓ Response message validated`);

      addTestResult(testName, 'PASSED', {
        statusCode: response.status(),
        message: responseBody.message,
        appointmentTime: startTime
      });

    } catch (error) {
      console.error(`✗ ${testName} failed:`, error.message);
      addTestResult(testName, 'FAILED', {
        error: error.message
      });
      throw error;
    }
  });
});

// Generate HTML test report
function generateTestReport() {
  const reportHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>eCareHealth API Test Report</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background-color: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            border-bottom: 2px solid #4CAF50;
            padding-bottom: 10px;
        }
        .summary {
            display: flex;
            gap: 20px;
            margin: 20px 0;
        }
        .summary-card {
            flex: 1;
            padding: 15px;
            border-radius: 5px;
            text-align: center;
        }
        .summary-card.total {
            background-color: #e3f2fd;
            color: #1976d2;
        }
        .summary-card.passed {
            background-color: #e8f5e9;
            color: #388e3c;
        }
        .summary-card.failed {
            background-color: #ffebee;
            color: #c62828;
        }
        .test-result {
            margin: 15px 0;
            padding: 15px;
            border-left: 4px solid;
            background-color: #f9f9f9;
        }
        .test-result.passed {
            border-color: #4CAF50;
        }
        .test-result.failed {
            border-color: #f44336;
        }
        .test-name {
            font-weight: bold;
            font-size: 16px;
            margin-bottom: 10px;
        }
        .test-details {
            font-size: 14px;
            color: #666;
        }
        .timestamp {
            font-size: 12px;
            color: #999;
            margin-top: 10px;
        }
        .status-badge {
            display: inline-block;
            padding: 3px 10px;
            border-radius: 3px;
            font-size: 12px;
            font-weight: bold;
            margin-left: 10px;
        }
        .status-badge.passed {
            background-color: #4CAF50;
            color: white;
        }
        .status-badge.failed {
            background-color: #f44336;
            color: white;
        }
        pre {
            background-color: #f5f5f5;
            padding: 10px;
            border-radius: 4px;
            overflow-x: auto;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>eCareHealth API Test Execution Report</h1>
        <p><strong>Test Suite:</strong> eCareHealth API Integration Tests</p>
        <p><strong>Execution Time:</strong> ${new Date().toLocaleString()}</p>
        
        <div class="summary">
            <div class="summary-card total">
                <h3>${testContext.testResults.length}</h3>
                <p>Total Tests</p>
            </div>
            <div class="summary-card passed">
                <h3>${testContext.testResults.filter(r => r.status === 'PASSED').length}</h3>
                <p>Passed</p>
            </div>
            <div class="summary-card failed">
                <h3>${testContext.testResults.filter(r => r.status === 'FAILED').length}</h3>
                <p>Failed</p>
            </div>
        </div>

        <h2>Test Results</h2>
        ${testContext.testResults.map(result => `
            <div class="test-result ${result.status.toLowerCase()}">
                <div class="test-name">
                    ${result.testName}
                    <span class="status-badge ${result.status.toLowerCase()}">${result.status}</span>
                </div>
                <div class="test-details">
                    <pre>${JSON.stringify(result.details, null, 2)}</pre>
                </div>
                <div class="timestamp">Executed at: ${new Date(result.timestamp).toLocaleString()}</div>
            </div>
        `).join('')}
    </div>
</body>
</html>
  `;

  // Save the report
  const reportPath = path.join(__dirname, 'test-report.html');
  fs.writeFileSync(reportPath, reportHtml);
  console.log(`\n✓ Test report generated: ${reportPath}`);

  // Also generate a CLI summary
  console.log('\n========================================');
  console.log('TEST EXECUTION SUMMARY');
  console.log('========================================');
  console.log(`Total Tests: ${testContext.testResults.length}`);
  console.log(`Passed: ${testContext.testResults.filter(r => r.status === 'PASSED').length}`);
  console.log(`Failed: ${testContext.testResults.filter(r => r.status === 'FAILED').length}`);
  console.log('========================================\n');

  testContext.testResults.forEach(result => {
    const statusSymbol = result.status === 'PASSED' ? '✓' : '✗';
    console.log(`${statusSymbol} ${result.testName}: ${result.status}`);
    if (result.status === 'FAILED') {
      console.log(`  Error: ${result.details.error}`);
    }
  });
}