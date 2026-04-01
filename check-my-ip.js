/**
 * Check Current Public IP Address
 * Use this to verify your IP is whitelisted in MongoDB Atlas
 */

const https = require('https');

console.log('🌐 Checking your public IP address...\n');

// Try multiple IP check services
const services = [
    { name: 'ipify', url: 'https://api.ipify.org?format=json' },
    { name: 'ipapi', url: 'https://ipapi.co/json/' },
    { name: 'ip-api', url: 'http://ip-api.com/json/' }
];

async function checkIP(service) {
    return new Promise((resolve, reject) => {
        const protocol = service.url.startsWith('https') ? https : require('http');
        
        protocol.get(service.url, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve({
                        service: service.name,
                        ip: json.ip || json.query,
                        country: json.country || json.country_name,
                        city: json.city,
                        isp: json.org || json.isp
                    });
                } catch (error) {
                    reject(error);
                }
            });
        }).on('error', reject);
    });
}

async function checkAllServices() {
    console.log('Checking multiple services...\n');
    
    for (const service of services) {
        try {
            const result = await checkIP(service);
            console.log(`✅ ${result.service}:`);
            console.log(`   IP: ${result.ip}`);
            if (result.country) console.log(`   Location: ${result.city || ''} ${result.country}`);
            if (result.isp) console.log(`   ISP: ${result.isp}`);
            console.log('');
        } catch (error) {
            console.log(`❌ ${service.name}: Failed to check`);
        }
    }
    
    console.log('=' .repeat(50));
    console.log('\n💡 Next steps:');
    console.log('1. Copy your IP address from above');
    console.log('2. Go to MongoDB Atlas → Network Access');
    console.log('3. Make sure your IP is in the whitelist');
    console.log('4. Or add 0.0.0.0/0 to allow all IPs (for development only)');
    console.log('\n🔗 MongoDB Atlas: https://cloud.mongodb.com/');
}

checkAllServices().catch(error => {
    console.error('Error:', error.message);
});
