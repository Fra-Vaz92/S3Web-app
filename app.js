// app.js
const express = require('express');
const fileUpload = require('express-fileupload');
const { S3Client, ListObjectsV2Command, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors');

dotenv.config();

const app = express();
const port = 80;

const corsOptions = {
    origin: 'http://my-bucket-frontend-2.6.s3-website-us-east-1.amazonaws.com',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
};
app.use(cors(corsOptions));

app.use(fileUpload({}));
app.use(express.static(path.join(__dirname, 'public')));

// AWS S3 Client
const s3Client = new S3Client({
    region: 'us-east-1',
});

const UPLOAD_TEMP_PATH = './uploads';
if (!fs.existsSync(UPLOAD_TEMP_PATH)) {
    fs.mkdirSync(UPLOAD_TEMP_PATH);
}

// 1. List only resized thumbnails
app.get('/objects', async (req, res) => {
    try {
        const listObjectsParams = {
            Bucket: process.env.BUCKET_NAME,
            Prefix: 'resized-images/',
        };
        const listObjectsCmd = new ListObjectsV2Command(listObjectsParams);
        const listObjectsResponse = await s3Client.send(listObjectsCmd);

        const files = (listObjectsResponse.Contents || []).map(obj => ({
            Key: obj.Key.replace('resized-images/', ''),
            Url: `https://${process.env.BUCKET_NAME}.s3.amazonaws.com/${obj.Key}`,
        }));

        res.json(files);
    } catch (error) {
        console.error('GET /objects error:', error);
        res.status(500).json({ error: 'Error listing objects', details: error.message });
    }
});

// 2. Upload file to original-images/ prefix
app.post('/objects', async (req, res) => {
    try {
        if (!req.files || Object.keys(req.files).length === 0) {
            return res.status(400).json({ error: 'No files were uploaded.' });
        }

        const file = req.files.file;
        const fileName = file.name;
        const tempPath = `${UPLOAD_TEMP_PATH}/${fileName}`;

        // Use a Promise to handle the asynchronous file.mv operation
        await new Promise((resolve, reject) => {
            file.mv(tempPath, (err) => {
                if (err) {
                    console.error('File move error:', err);
                    reject(err);
                } else {
                    resolve();
                }
            });
        });

        const fileContent = fs.readFileSync(tempPath);
        const uploadParams = {
            Bucket: process.env.BUCKET_NAME,
            Key: `original-images/${fileName}`,
            Body: fileContent,
        };
        const uploadCmd = new PutObjectCommand(uploadParams);
        await s3Client.send(uploadCmd);
        fs.unlinkSync(tempPath);
        res.json({ message: 'File uploaded successfully!' });

    } catch (error) {
        console.error('Error in /objects POST:', error);
        res.status(500).json({ error: 'File upload failed.', details: error.message });
    }
});

// 3. Get original image
app.get('/objects/:key', async (req, res) => {
    try {
        const getObjectParams = {
            Bucket: process.env.BUCKET_NAME,
            Key: `original-images/${req.params.key}`,
        };
        const getObjectCmd = new GetObjectCommand(getObjectParams);
        const getObjectResponse = await s3Client.send(getObjectCmd);

        res.setHeader('Content-Disposition', `inline; filename="${req.params.key}"`);
        getObjectResponse.Body.pipe(res);
    } catch (error) {
        console.error('Error retrieving object:', error);
        res.status(500).send('Error retrieving object');
    }
});

// **Health check route:**
app.get('/', (req, res) => {
    res.status(200).send('Server is healthy!');
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});