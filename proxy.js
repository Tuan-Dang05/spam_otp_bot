const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');
const fs = require('fs').promises;

const MAX_PROXIES_TO_TEST = 10;
const PROXY_FILE = 'working_proxies.txt';
const TEST_URL = 'https://httpbin.org/ip';

// Function to load proxies from the file in the format: ip:port:username:password
async function loadProxiesFromFile() {
    try {
        const data = await fs.readFile(PROXY_FILE, 'utf8');
        const proxies = data.split('\n').filter(Boolean).map(proxy => {
            // Parse the proxy string in the format ip:port:username:password
            const [ip, port, username, password] = proxy.split(':');
            return `http://${username}:${password}@${ip}:${port}`;
        });
        console.log(`Loaded ${proxies.length} proxies from file`);
        return proxies;
    } catch (error) {
        console.log('Proxy file not found or error reading file.');
        return [];
    }
}

// Function to test the loaded proxies
async function testProxy(proxy) {
    try {
        await axios.get(TEST_URL, {
            httpsAgent: new HttpsProxyAgent(proxy),
            timeout: 2000,
            proxy: false
        });
        console.log(`Proxy ${proxy} is working`);
        return proxy;
    } catch (error) {
        console.log(`Proxy ${proxy} failed: ${error.message}`);
        return null;
    }
}

// Function to get the next working proxy
async function getNextProxy(attempt = 0) {
    let proxies = await loadProxiesFromFile();
    if (proxies.length === 0) throw new Error('No working proxies available.');
    const proxy = proxies[attempt % proxies.length];
    console.log(`Using proxy: ${proxy}`);
    return proxy;
}

// Function to make a request using the proxy
async function makeRequestWithProxy(url, method, data, headers) {
    const maxAttempts = 5;
    for (let attempts = 0; attempts < maxAttempts; attempts++) {
        const proxy = await getNextProxy(attempts);
        try {
            const response = await axios({
                url,
                method,
                data,
                headers,
                httpsAgent: new HttpsProxyAgent(proxy),
                timeout: 3000,
                proxy: false
            });
            if (response.data) {
                console.log('Request successful', response.data);
                return response.data;
            }
            console.log('API Response Error:', response.data.message);
        } catch (error) {
            handleRequestError(error, proxy);
            if (error.response?.status === 429) {
                await delay(1000);
            }
        }
    }
    console.error('All proxies failed after several attempts.');
    throw new Error('All proxies failed and no new proxies available.');
}

// Function to handle request errors
function handleRequestError(error, proxy) {
    if (error.response) {
        console.error(`HTTP Error ${error.response.status}. Switching to next proxy...`);
    } else if (error.code === 'ETIMEDOUT') {
        console.log('Proxy timed out. Switching to next proxy...');
    } else {
        console.error(`Proxy ${proxy} failed: ${error.message}`);
    }
}

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

module.exports = makeRequestWithProxy;
