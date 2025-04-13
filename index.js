const AWS = require('aws-sdk');
const S3 = new AWS.S3();
const sharp = require('sharp');

exports.handler = async (event) => {
    try {
        const region = event.Records[0].awsRegion;
        const sourceBucket = event.Records[0].s3.bucket.name;
        const rawSourceKey = event.Records[0].s3.object.key;
        const sourceKey = decodeURIComponent(rawSourceKey.replace(/\+/g, " "));

        console.log(`Raw S3 key: ${rawSourceKey}`);
        console.log(`Decoded S3 key: ${sourceKey}`);

        // Ensure the key starts with the original images prefix
        const originalPrefix = 'original-images/';
        if (!sourceKey.startsWith(originalPrefix)) {
            console.log(`Object key does not start with '${originalPrefix}'. Skipping.`);
            return;
        }

        const destinationBucket = sourceBucket;
        const destinationKey = `resized-images/${sourceKey.substring(originalPrefix.length)}`; // Keep the path after the prefix

        console.log(`Workspaceing object from bucket: ${sourceBucket}, key: ${sourceKey}`);

        // Get the image from the source S3 bucket.
        const image = await S3.getObject({
            Bucket: sourceBucket,
            Key: sourceKey
        }).promise();

        console.log(`Image size: ${image.ContentLength} bytes, Content-Type: ${image.ContentType}`);

        if (!image.Body || image.Body.length === 0) {
            throw new Error('Image body is empty.');
        }

        // Resize the image using sharp.
        const resizedImage = await sharp(image.Body)
            .resize(700) // You can adjust the resizing options as needed
            .toBuffer();

        // Dynamically handle content type
        const contentType = image.ContentType || 'image/jpeg';

        // Log before uploading the resized image
        console.log(`Uploading resized image to bucket: ${destinationBucket}, key: ${destinationKey}`);

        // Upload the resized image to the destination S3 bucket.
        await S3.putObject({
            Bucket: destinationBucket,
            Key: destinationKey,
            Body: resizedImage,
            ContentType: contentType
        }).promise();

        console.log(`Successfully resized ${sourceBucket}/${sourceKey} and uploaded to ${destinationBucket}/${destinationKey}`);
    } catch (error) {
        console.error(`Error processing ${sourceBucket}/${sourceKey}: `, error);
        throw error;
    }
};