import fetch from 'node-fetch';

async function testPlatformFiltering() {
  console.log('Testing platform filtering in the scores API...');
  
  // Test with no platform filter
  console.log('\n1. Testing with no platform filter:');
  const noFilterResponse = await fetch('http://localhost:3001/api/scores');
  const noFilterData = await noFilterResponse.json();
  
  // Group by platform
  const noFilterPlatforms = noFilterData.reduce((acc: any, score: any) => {
    if (!acc[score.platform]) {
      acc[score.platform] = 0;
    }
    acc[score.platform]++;
    return acc;
  }, {});
  
  console.log('Platforms in response:', Object.keys(noFilterPlatforms));
  console.log('Counts by platform:', noFilterPlatforms);
  
  // Test with TikTok filter
  console.log('\n2. Testing with TikTok filter:');
  const tiktokResponse = await fetch('http://localhost:3001/api/scores?platform=TikTok');
  const tiktokData = await tiktokResponse.json();
  
  // Group by platform
  const tiktokPlatforms = tiktokData.reduce((acc: any, score: any) => {
    if (!acc[score.platform]) {
      acc[score.platform] = 0;
    }
    acc[score.platform]++;
    return acc;
  }, {});
  
  console.log('Platforms in response:', Object.keys(tiktokPlatforms));
  console.log('Counts by platform:', tiktokPlatforms);
  
  // Test with Google DV360 filter
  console.log('\n3. Testing with Google DV360 filter:');
  const dv360Response = await fetch('http://localhost:3001/api/scores?platform=Google%20DV360');
  const dv360Data = await dv360Response.json();
  
  // Group by platform
  const dv360Platforms = dv360Data.reduce((acc: any, score: any) => {
    if (!acc[score.platform]) {
      acc[score.platform] = 0;
    }
    acc[score.platform]++;
    return acc;
  }, {});
  
  console.log('Platforms in response:', Object.keys(dv360Platforms));
  console.log('Counts by platform:', dv360Platforms);
  
  // Test with Meta filter
  console.log('\n4. Testing with Meta filter:');
  const metaResponse = await fetch('http://localhost:3001/api/scores?platform=Meta');
  const metaData = await metaResponse.json();
  
  // Group by platform
  const metaPlatforms = metaData.reduce((acc: any, score: any) => {
    if (!acc[score.platform]) {
      acc[score.platform] = 0;
    }
    acc[score.platform]++;
    return acc;
  }, {});
  
  console.log('Platforms in response:', Object.keys(metaPlatforms));
  console.log('Counts by platform:', metaPlatforms);
}

testPlatformFiltering()
  .then(() => console.log('Test completed'))
  .catch(error => console.error('Test failed:', error));
