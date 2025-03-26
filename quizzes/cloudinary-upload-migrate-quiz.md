# Upload and Migrate Assets

This quiz focuses on Cloudinary's upload functionality, migration strategies, and asset management practices.

## Instructions

- Single-choice questions: Select the ONE best answer
- Multi-select questions: Select ALL answers that apply
- Pay attention to technical details in questions about APIs and parameters

---

## Questions

**1. Which parameter would you use to upload a large video file in chunks to Cloudinary?**

A) file_size
B) chunk_size
C) max_file_size  
D) large_upload

**Difficulty:** Medium

**2. When uploading images programmatically to Cloudinary, which of these methods provides the highest level of security?**

A) Using unsigned upload presets with restricted access rights
B) Using signed uploads with authentication signatures
C) Using the API key and API secret directly in client-side code
D) Using the Upload widget with automatic authentication

**Difficulty:** Easy

**3. You need to migrate 500,000 images from your existing storage to Cloudinary. Which approach would be most efficient?**

A) Using the Media Library's bulk upload feature through the user interface
B) Using the Upload API with concurrent uploads from a dedicated migration script
C) Setting up automatic synchronization using Cloudinary's fetch URL method
D) Manually uploading the most important assets and leaving the rest in the original storage

**Difficulty:** Medium

**4. Which of the following are valid methods for uploading files to Cloudinary? (Select all that apply)**

A) Server-side upload using the SDK
B) Direct browser-to-Cloudinary upload
C) Auto-upload from a remote URL
D) FTP transfer to Cloudinary storage
E) Webhook-triggered uploads

**Difficulty:** Easy

**5. Which of these code snippets correctly implements a secure signed upload in Node.js?**

A)

```javascript
cloudinary.uploader.upload("sample.jpg", {
  public_id: "sample_id",
  api_key: "YOUR_API_KEY",
  api_secret: "YOUR_API_SECRET",
});
```

B)

```javascript
cloudinary.config({
  cloud_name: "your_cloud",
  api_key: "YOUR_API_KEY",
  api_secret: "YOUR_API_SECRET",
});
cloudinary.uploader.upload("sample.jpg", { public_id: "sample_id" });
```

C)

```javascript
cloudinary.config({ cloud_name: "your_cloud" });
cloudinary.uploader.unsigned_upload("sample.jpg", "upload_preset", {
  public_id: "sample_id",
});
```

D)

```javascript
const timestamp = Math.round(new Date().getTime() / 1000);
const signature = cloudinary.utils.api_sign_request(
  {
    timestamp: timestamp,
    public_id: "sample_id",
  },
  "YOUR_API_SECRET"
);
cloudinary.uploader.upload("sample.jpg", {
  public_id: "sample_id",
  timestamp: timestamp,
  signature: signature,
});
```

**Difficulty:** Hard

**6. Which upload method should be used when you need to replace an existing asset while maintaining the same public ID and all derived transformations?**

A) explicit
B) rename
C) destroy + upload
D) upload with overwrite flag

**Difficulty:** Medium

**7. When using a backend service to generate a signature for secure uploads, which parameters must be included in the signature calculation? (Select all that apply)**

A) timestamp
B) public_id (if specifying a custom public ID)
C) upload_preset
D) api_key
E) cloud_name

**Difficulty:** Hard

**8. A customer wants to migrate videos from YouTube to Cloudinary. Which approach would you recommend?**

A) Manual download from YouTube and upload to Cloudinary
B) Use the Add-on YouTube connector in the Media Library
C) Use the remote URL upload feature with YouTube video URLs
D) Setup a fetch URL configuration for YouTube domain

**Difficulty:** Easy

**9. Which of these asset types can be uploaded directly to Cloudinary? (Select all that apply)**

A) Images
B) Videos
C) PDFs
D) Audio files
E) Raw files (like text, JSON, XML)

**Difficulty:** Medium

**10. When implementing a large-scale migration of assets to Cloudinary, which of these approaches would help prevent rate limiting issues? (Select all that apply)**

A) Use exponential backoff for retries
B) Implement queue-based uploads with controlled concurrency
C) Set higher timeout values in the SDK configuration
D) Obtain a temporary rate limit increase from Cloudinary support
E) Upload during off-peak hours

**Difficulty:** Medium

**11. You need to upload user-generated content from a mobile application directly to Cloudinary. Which is the most secure approach?**

A) Embed the API key and secret in the mobile app code
B) Use unsigned uploads with an upload preset
C) Proxy the upload through your own backend server
D) Generate a signed upload URL from your backend server

**Difficulty:** Medium

**12. What is the default behavior when uploading a file with the same public ID as an existing asset?**

A) The upload fails with an error
B) A new version of the asset is created
C) The existing asset is replaced
D) The new asset is renamed automatically with a suffix

**Difficulty:** Easy

**13. When migrating terabytes of archival images that will be accessed infrequently, which approach provides the optimal balance of storage costs and performance?**

A) Eager transformation during upload to pre-generate all required sizes
B) Lazy migration that uploads assets only when they are first requested
C) Bulk upload with minimal transformations and on-the-fly transformations when needed
D) Manual curation and upload of selected assets only

**Difficulty:** Hard

**14. When implementing a high-throughput asset upload system that needs resilience against network failures, which approach is most effective?**

A) Client-side retry logic with exponential backoff
B) Server-side queuing with asynchronous processing
C) Multi-region upload endpoints with failover routing
D) Chunked uploads with resumable transfer capability

**Difficulty:** Hard

**15. Which of these methods can be used to enforce upload restrictions for user-generated content? (Select all that apply)**

A) Setting allowed file types using upload presets
B) Implementing maximum file size limits
C) Using content moderation add-ons
D) Restricting uploads to specific IP addresses
E) Setting image dimension limits

**Difficulty:** Medium

## Answers

1. B - The chunk_size parameter enables uploading large files in chunks.
2. B - Signed uploads with authentication signatures provide the highest level of security.
3. B - Using the Upload API with concurrent uploads from a dedicated migration script is the most efficient approach for large-scale migrations.
4. A, B, C - Server-side upload, direct browser upload, and auto-upload from remote URLs are all valid upload methods.
5. B - Option B correctly configures the SDK with credentials and then performs a standard upload.
6. D - Upload with the overwrite flag (overwrite=true) will replace an existing asset while maintaining derived assets.
7. A, B - The timestamp and public_id (if used) must be included in the signature calculation for secure uploads.
8. C - Using remote URL upload with YouTube video URLs is the recommended approach.
9. A, B, C, D, E - Cloudinary supports direct upload of images, videos, PDFs, audio files, and raw files.
10. A, B, D, E - Using exponential backoff, queue-based uploads, obtaining a rate limit increase, and uploading during off-peak hours all help prevent rate limiting issues.
11. D - Generating a signed upload URL from your backend server is the most secure approach for mobile apps.
12. C - By default, the existing asset is replaced when uploading with the same public ID.
13. B - Lazy migration is most appropriate for infrequently accessed archival images.
14. D - Chunked uploads with resumable transfer capability provide the most effective resilience against network failures in high-throughput systems.
15. A, B, E - Setting allowed file types, maximum file size limits, and image dimension limits can enforce upload restrictions.
