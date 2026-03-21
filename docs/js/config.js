const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const CONFIG = {
    API_BASE_URL: isLocalhost ? 'http://localhost:3000' : 'https://huupmerkm6.ap-southeast-1.awsapprunner.com'
};

window.CONFIG = CONFIG;
