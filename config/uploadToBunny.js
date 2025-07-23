const axios = require('axios');

async function uploadToBunny(fileBuffer, fileName) {
    const zoneName = 'nexkart-storage';
    const storageHost = 'sg.storage.bunnycdn.com';
    const accessKey = process.env.BUNNY_ACCESS_KEY;

    const uploadUrl = `https://${storageHost}/${zoneName}/${fileName}`;

    try {
        const response = await axios.put(uploadUrl, fileBuffer, {
            headers: {
                AccessKey: accessKey,
                'Content-Type': 'application/octet-stream'
            }
        });

        if (response.status === 201 || response.status === 200) {
            return `https://nexkart-storage.b-cdn.net/${fileName}`;
        } else {
            throw new Error(`Upload failed with status ${response.status}`);
        }
    } catch (error) {
        console.error('Bunny upload error:', error.response?.data || error.message);
        throw error;
    }
}

module.exports = { uploadToBunny };