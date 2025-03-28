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

1. B - chunk_size.

**Explanation:** The `chunk_size` parameter enables Cloudinary's chunked upload capability, which breaks large files into smaller segments for transmission. This approach improves reliability for large file uploads by allowing resume capability after network interruptions and provides progress tracking during upload.

2. B - Using signed uploads with authentication signatures.

**Explanation:** Signed uploads provide the highest security level because they cryptographically verify upload requests using your API secret without exposing it in client code. The signature ensures the upload parameters haven't been tampered with and that the upload is authorized by your application.

3. B - Using the Upload API with concurrent uploads from a dedicated migration script.

**Explanation:** For large-scale migrations (500,000 images), a dedicated script using the Upload API with controlled concurrency provides the best balance of speed, reliability, and control. This approach allows for error handling, retries, progress tracking, and optimization of the migration process while leveraging Cloudinary's API capabilities.

4. A - Server-side upload using the SDK.
   B - Direct browser-to-Cloudinary upload.
   C - Auto-upload from a remote URL.

**Explanation:** Cloudinary supports these three primary upload methods. Server-side uploads using the SDK provide security and control, direct browser uploads improve performance by bypassing your servers, and remote URL uploads allow importing content directly from other web locations without downloading first.

5. B -

```javascript
cloudinary.config({
  cloud_name: "your_cloud",
  api_key: "YOUR_API_KEY",
  api_secret: "YOUR_API_SECRET",
});
cloudinary.uploader.upload("sample.jpg", { public_id: "sample_id" });
```

**Explanation:** This code correctly implements a secure server-side upload. It first configures the SDK with proper credentials (cloud name, API key, and API secret) and then performs the upload operation. This approach keeps credentials secure on the server while providing full upload functionality.

6. D - upload with overwrite flag.

**Explanation:** Using the upload method with `overwrite: true` parameter is the most direct way to replace an existing asset while maintaining the same public ID. This approach preserves all derived assets and transformations associated with the original public ID, ensuring continuity while updating the base asset.

7. A - timestamp.
   B - public_id (if specifying a custom public ID).

**Explanation:** When generating a signature for secure uploads, the timestamp is always required to prevent replay attacks, and the public_id must be included in the signature if you're specifying a custom one. These parameters must match exactly between the signature calculation and the actual upload request.

8. C - Use the remote URL upload feature with YouTube video URLs.

**Explanation:** Cloudinary's remote URL upload feature can directly import videos from YouTube URLs, handling all the downloading and processing automatically. This approach is more efficient than manual downloading and uploading, and doesn't require additional add-ons or configurations.

9. A - Images.
   B - Videos.
   C - PDFs.
   D - Audio files.
   E - Raw files (like text, JSON, XML).

**Explanation:** Cloudinary supports uploading all these file types directly. Images and videos receive specialized processing and transformation capabilities, PDFs can be manipulated and converted, audio files can be transcoded, and raw files can be stored and delivered without modifications.

10. A - Use exponential backoff for retries.
    B - Implement queue-based uploads with controlled concurrency.
    D - Obtain a temporary rate limit increase from Cloudinary support.
    E - Upload during off-peak hours.

**Explanation:** These approaches help prevent rate limiting during large-scale migrations. Exponential backoff intelligently handles intermittent failures, queue-based uploads control the request rate, obtaining a temporary rate limit increase provides additional capacity, and off-peak uploads reduce competition with normal operations.

11. D - Generate a signed upload URL from your backend server.

**Explanation:** This approach provides the best security for mobile applications. The backend server generates a time-limited signature using the API secret (which remains secure on the server), and the mobile app uses this signature to upload directly to Cloudinary. This prevents exposing API credentials in the mobile app while enabling direct uploads.

12. C - The existing asset is replaced.

**Explanation:** By default, Cloudinary replaces the existing asset when a new file is uploaded with the same public ID. This behavior can be modified with parameters like `use_filename`, `unique_filename`, or by checking for existing assets before uploading, but the default behavior is replacement.

13. B - Lazy migration that uploads assets only when they are first requested.

**Explanation:** For rarely accessed archival images, lazy migration provides the optimal balance between storage costs and migration effort. This approach only transfers assets when they're actually needed, avoiding unnecessary migration of images that may never be accessed. It requires setting up a fallback mechanism that checks for missing assets and uploads them on first access.

14. D - Chunked uploads with resumable transfer capability.

**Explanation:** For high-throughput systems requiring network resilience, chunked uploads with resume capability provide the best solution. This approach breaks files into smaller segments that can be transferred independently, allowing uploads to pause and resume at the chunk level rather than restarting the entire file transfer after a failure.

15. A - Setting allowed file types using upload presets.
    B - Implementing maximum file size limits.
    E - Setting image dimension limits.

**Explanation:** These methods effectively restrict user-generated content uploads. Upload presets can limit allowed file types by format and MIME type, maximum file size limits prevent excessively large uploads, and dimension limits can prevent uploads of images that are too small or too large for your application's requirements.
