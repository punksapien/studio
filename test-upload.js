import fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';

async function testUpload() {
  try {
    console.log('🧪 Testing image upload API...');

    // Create a simple test image file (1x1 PNG)
    const testImageBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
      0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0xF8, 0x00, 0x00, 0x00,
      0x01, 0x00, 0x01, 0x5C, 0xC2, 0x5D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49,
      0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);

    fs.writeFileSync('test-image.png', testImageBuffer);

    // Test without authentication first
    console.log('📤 Testing upload without authentication...');
    const formData = new FormData();
    formData.append('file', fs.createReadStream('test-image.png'));
    formData.append('document_type', 'image_url_1');

    const response = await fetch('http://localhost:3000/api/listings/upload', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    console.log('📊 Response status:', response.status);
    console.log('📊 Response body:', JSON.stringify(result, null, 2));

    if (response.status === 401) {
      console.log('✅ Authentication check working correctly - got 401 as expected');
    } else {
      console.log('❌ Expected 401 for unauthenticated request');
    }

    // Clean up
    fs.unlinkSync('test-image.png');
    console.log('🧹 Cleaned up test file');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testUpload();
