import { S3Client, ListBucketsCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
    region: 'auto',
    endpoint: 'https://d599ed534f15c9973e1dd5e471695a07.r2.cloudflarestorage.com',
    credentials: {
        accessKeyId: '<your-access-key-id>',
        secretAccessKey: '<your-secret-access-key>',
    },
    forcePathStyle: true,
});

async function testConnection() {
    try {
        const buckets = await s3.send(new ListBucketsCommand({}));
        console.log('✅ Connection successful:', buckets);
    } catch (error) {
        console.error('❌ Connection failed:', error);
    }
}

testConnection();
