# Upload and Migrate Assets

This quiz focuses on Cloudinary's upload functionality, migration strategies, video assets handling, and the relationship between SDK calls and HTML output.

## Instructions

- Single-choice questions: Select the ONE best answer
- Multi-select questions: Select ALL answers that apply
- Pay attention to code examples and expected outputs in questions

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

**3. Given the following Node.js SDK code, what HTML output will be generated?**

```javascript
cloudinary.video("training_video", {
  height: 250,
  width: 400,
  crop: "fill",
  controls: true,
  fallback_content: "Your browser does not support HTML5 video",
});
```

A)

```html
<video height="250" width="400" controls>
  <source
    src="https://res.cloudinary.com/demo/video/upload/c_fill,h_250,w_400/training_video.mp4"
    type="video/mp4"
  />
  <source
    src="https://res.cloudinary.com/demo/video/upload/c_fill,h_250,w_400/training_video.webm"
    type="video/webm"
  />
  Your browser does not support HTML5 video
</video>
```

B)

```html
<video
  src="https://res.cloudinary.com/demo/video/upload/c_fill,h_250,w_400/training_video"
  height="250"
  width="400"
  controls
>
  Your browser does not support HTML5 video
</video>
```

C)

```html
<video controls>
  <source
    src="https://res.cloudinary.com/demo/video/upload/h_250,w_400,c_fill/training_video.mp4"
    type="video/mp4"
  />
  <source
    src="https://res.cloudinary.com/demo/video/upload/h_250,w_400,c_fill/training_video.webm"
    type="video/webm"
  />
  <source
    src="https://res.cloudinary.com/demo/video/upload/h_250,w_400,c_fill/training_video.ogv"
    type="video/ogg"
  />
  Your browser does not support HTML5 video
</video>
```

D)

```html
<iframe
  src="https://res.cloudinary.com/demo/video/upload/c_fill,h_250,w_400/training_video"
  height="250"
  width="400"
  allowfullscreen
  frameborder="0"
>
  Your browser does not support HTML5 video
</iframe>
```

**Difficulty:** Hard

**4. You need to migrate 500,000 images from your existing storage to Cloudinary. Which approach would be most efficient?**

A) Using the Media Library's bulk upload feature through the user interface
B) Using the Upload API with concurrent uploads from a dedicated migration script
C) Setting up automatic synchronization using Cloudinary's fetch URL method
D) Manually uploading the most important assets and leaving the rest in the original storage

**Difficulty:** Medium

**5. Which of the following are valid methods for uploading files to Cloudinary? (Select all that apply)**

A)

```javascript
cloudinary.uploader.upload("local_file.jpg", options);
```

B)

```javascript
cloudinary.unsigned_upload("file", "upload_preset");
```

C)

```javascript
cloudinary.uploader.upload("https://example.com/image.jpg");
```

D)

```javascript
cloudinary.ftp.upload("file.jpg");
```

E)

```javascript
cloudinary.uploader.upload("file", {
  notification_url: "https://your-webhook-endpoint.com",
});
```

**Difficulty:** Easy

**6. What will be the HTML output of this JavaScript SDK call?**

```javascript
cloudinary.video("ocean_scene", {
  width: 300,
  height: 200,
  crop: "pad",
  background: "lightblue",
  sources: ["webm", "mp4", "ogv"],
});
```

A)

```html
<video width="300" height="200">
  <source
    src="https://res.cloudinary.com/demo/video/upload/b_lightblue,c_pad,h_200,w_300/ocean_scene.webm"
    type="video/webm"
  />
  <source
    src="https://res.cloudinary.com/demo/video/upload/b_lightblue,c_pad,h_200,w_300/ocean_scene.mp4"
    type="video/mp4"
  />
  <source
    src="https://res.cloudinary.com/demo/video/upload/b_lightblue,c_pad,h_200,w_300/ocean_scene.ogv"
    type="video/ogg"
  />
</video>
```

B)

```html
<video
  poster="https://res.cloudinary.com/demo/video/upload/b_lightblue,c_pad,h_200,w_300/ocean_scene.jpg"
  width="300"
  height="200"
>
  <source
    src="https://res.cloudinary.com/demo/video/upload/b_lightblue,c_pad,h_200,w_300/ocean_scene.webm"
    type="video/webm"
  />
  <source
    src="https://res.cloudinary.com/demo/video/upload/b_lightblue,c_pad,h_200,w_300/ocean_scene.mp4"
    type="video/mp4"
  />
  <source
    src="https://res.cloudinary.com/demo/video/upload/b_lightblue,c_pad,h_200,w_300/ocean_scene.ogv"
    type="video/ogg"
  />
</video>
```

C)

```html
<video width="300" height="200" style="background:lightblue;">
  <source
    src="https://res.cloudinary.com/demo/video/upload/c_pad,h_200,w_300/ocean_scene.webm"
    type="video/webm"
  />
  <source
    src="https://res.cloudinary.com/demo/video/upload/c_pad,h_200,w_300/ocean_scene.mp4"
    type="video/mp4"
  />
  <source
    src="https://res.cloudinary.com/demo/video/upload/c_pad,h_200,w_300/ocean_scene.ogv"
    type="video/ogg"
  />
</video>
```

D)

```html
<video
  src="https://res.cloudinary.com/demo/video/upload/b_lightblue,c_pad,h_200,w_300/ocean_scene"
  width="300"
  height="200"
></video>
```

**Difficulty:** Hard

**7. Which of these code snippets correctly implements a secure signed upload in Node.js?**

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
cloudinary.uploader.upload("sample.jpg", {
  public_id: "sample_id",
});
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

**8. Which upload method should be used when you need to replace an existing asset while maintaining the same public ID and all derived transformations?**

A) explicit
B) rename
C) destroy + upload
D) upload with overwrite flag

**Difficulty:** Medium

**9. When uploading a video to Cloudinary, which of these parameters would you use to automatically generate an animated GIF preview? (Select all that apply)**

A)

```javascript
{
  eager: [
    {
      format: "gif",
      transformation: "vs_30",
    },
  ];
}
```

B)

```javascript
{
  resource_type: "video";
}
```

C)

```javascript
{
  eager_async: true;
}
```

D)

```javascript
{
  eager: [{ format: "gif" }];
}
```

E)

```javascript
{
  create_derived: true;
}
```

**Difficulty:** Medium

**10. A customer wants to migrate videos from YouTube to Cloudinary. Which approach would you recommend?**

A) Manual download from YouTube and upload to Cloudinary
B) Use the Add-on YouTube connector in the Media Library
C) Use the remote URL upload feature with YouTube video URLs
D) Setup a fetch URL configuration for YouTube domain

**Difficulty:** Easy

**11. Which of these asset types can be uploaded directly to Cloudinary? (Select all that apply)**

A) Images
B) Videos
C) PDFs
D) Audio files
E) Raw files (like text, JSON, XML)

**Difficulty:** Easy

**12. Which of these approaches is most appropriate for migrating terabytes of archival video content that will be accessed infrequently?**

A) Eager transformation during upload to pre-generate all required formats
B) Lazy migration that uploads videos only when they are first requested
C) Bulk upload with minimal transformations and on-the-fly transformations when needed
D) Manual curation and upload of selected videos only

**Difficulty:** Hard

**13. What special handling is required when uploading video files larger than 100MB to Cloudinary? (Select all that apply)**

A) Use chunked uploading with the chunk_size parameter
B) Enable the large_file_upload option
C) Configure a higher timeout value for the upload request
D) Use a direct S3 upload path instead of the regular upload API
E) Enable the upload_large flag

**Difficulty:** Medium

**14. Which Cloudinary SDK method would you use to generate video thumbnails at specific times?**

A)

```javascript
cloudinary.video_thumbnail({
  resource_type: "video",
  timestamps: [5, 15, 25],
});
```

B)

```javascript
cloudinary.explode({
  resource_type: "video",
  timestamps: [5, 15, 25],
});
```

C)

```javascript
cloudinary.uploader.explicit("video_id", {
  resource_type: "video",
  eager: [
    {
      format: "jpg",
      start_offset: "5",
    },
  ],
});
```

D)

```javascript
cloudinary.generate_sprites("video_id", {
  resource_type: "video",
  timestamps: [5, 15, 25],
});
```

**Difficulty:** Medium

**15. When implementing a system to handle user-uploaded videos, which of these approaches provides the best balance of performance and user experience?**

A) Direct browser-to-Cloudinary upload with upload progress indicator
B) Upload to your server first, then transfer to Cloudinary asynchronously
C) Use a chunked upload approach with background processing
D) Stream the video directly to Cloudinary as it's being recorded

**Difficulty:** Medium

## Answers

1. B - chunk_size.

**Explanation:** The `chunk_size` parameter enables Cloudinary's chunked upload capability for large video files. This approach breaks large videos into smaller segments that can be uploaded independently, providing better reliability for large files, upload progress tracking, and the ability to resume uploads after network interruptions.

2. B - Using signed uploads with authentication signatures.

**Explanation:** Signed uploads provide the highest level of security by cryptographically verifying that upload requests are authorized. This approach uses your API secret to generate a signature without exposing the secret in client code, ensuring the upload parameters haven't been tampered with and the upload is authorized by your application.

3. C -

```html
<video controls>
  <source
    src="https://res.cloudinary.com/demo/video/upload/h_250,w_400,c_fill/training_video.mp4"
    type="video/mp4"
  />
  <source
    src="https://res.cloudinary.com/demo/video/upload/h_250,w_400,c_fill/training_video.webm"
    type="video/webm"
  />
  <source
    src="https://res.cloudinary.com/demo/video/upload/h_250,w_400,c_fill/training_video.ogv"
    type="video/ogg"
  />
  Your browser does not support HTML5 video
</video>
```

**Explanation:** The Cloudinary SDK's video method generates a standard HTML5 video element with multiple source elements for different formats (MP4, WebM, OGV) to ensure cross-browser compatibility. It includes the transformation parameters in the URL and the fallback content for browsers that don't support HTML5 video.

4. B - Using the Upload API with concurrent uploads from a dedicated migration script.

**Explanation:** For migrating 500,000 images, a dedicated script using the Upload API with controlled concurrency provides the optimal approach. This method allows for parallel processing with error handling, retries, progress tracking, and can be optimized for throughput while respecting API rate limits.

5. A -

```javascript
cloudinary.uploader.upload("local_file.jpg", options);
```

B -

```javascript
cloudinary.unsigned_upload("file", "upload_preset");
```

C -

```javascript
cloudinary.uploader.upload("https://example.com/image.jpg");
```

**Explanation:** Cloudinary supports these three upload methods: server-side uploads of local files using the SDK (A), unsigned uploads from the browser using upload presets (B), and remote URL uploads that fetch content from other web locations (C). Options D and E are incorrect - Cloudinary doesn't support FTP uploads, and option E is just showing a notification URL parameter, not a different upload method.

6. A -

```html
<video width="300" height="200">
  <source
    src="https://res.cloudinary.com/demo/video/upload/b_lightblue,c_pad,h_200,w_300/ocean_scene.webm"
    type="video/webm"
  />
  <source
    src="https://res.cloudinary.com/demo/video/upload/b_lightblue,c_pad,h_200,w_300/ocean_scene.mp4"
    type="video/mp4"
  />
  <source
    src="https://res.cloudinary.com/demo/video/upload/b_lightblue,c_pad,h_200,w_300/ocean_scene.ogv"
    type="video/ogg"
  />
</video>
```

**Explanation:** The SDK's video method with the specified parameters generates a standard HTML5 video element with width and height attributes. The sources array defines which video formats to include (WebM, MP4, OGV), and the background and crop parameters are included in the transformation URL, not as HTML attributes or CSS.

7. B -

```javascript
cloudinary.config({
  cloud_name: "your_cloud",
  api_key: "YOUR_API_KEY",
  api_secret: "YOUR_API_SECRET",
});
cloudinary.uploader.upload("sample.jpg", {
  public_id: "sample_id",
});
```

**Explanation:** This code correctly implements a secure server-side upload by first configuring the SDK with proper credentials (cloud name, API key, and API secret) and then performing the upload operation. This is the standard pattern for server-side uploads where the API secret remains secure on the server.

8. D - upload with overwrite flag.

**Explanation:** Using the upload method with `overwrite: true` parameter is the most direct way to replace an existing asset while maintaining the same public ID and all derived transformations. This approach preserves all derived assets and transformation history while updating the base asset.

9. A -

```javascript
{
  eager: [
    {
      format: "gif",
      transformation: "vs_30",
    },
  ];
}
```

C -

```javascript
{
  eager_async: true;
}
```

**Explanation:** To automatically generate an animated GIF preview from a video, you need to specify an eager transformation that converts to GIF format with the `vs_30` transformation (which creates a video sampling effect for animated GIFs). The `eager_async: true` parameter allows this potentially resource-intensive operation to happen in the background without blocking the upload response.

10. C - Use the remote URL upload feature with YouTube video URLs.

**Explanation:** Cloudinary's remote URL upload feature can directly import videos from YouTube URLs, handling all the downloading and processing automatically. This approach is more efficient than manual downloading and doesn't require additional add-ons or configurations.

11. A - Images.
    B - Videos.
    C - PDFs.
    D - Audio files.
    E - Raw files (like text, JSON, XML).

**Explanation:** Cloudinary supports direct upload of all these asset types. Images and videos receive specialized processing and transformation capabilities, PDFs can be manipulated and converted to images, audio files can be transcoded and streamed, and raw files can be stored and delivered without modifications.

12. B - Lazy migration that uploads videos only when they are first requested.

**Explanation:** For terabytes of infrequently accessed archival video content, lazy migration provides the optimal approach. This strategy only uploads videos when they're actually requested, avoiding unnecessary migration of content that may never be accessed. This saves both storage costs and migration effort while ensuring content is available when needed.

13. A - Use chunked uploading with the chunk_size parameter.
    C - Configure a higher timeout value for the upload request.

**Explanation:** For videos larger than 100MB, chunked uploading is essential to ensure reliable transfers by breaking the file into smaller segments. Additionally, configuring higher timeout values prevents connection timeouts during the potentially lengthy upload process. The other options are not valid Cloudinary parameters or requirements.

14. C -

```javascript
cloudinary.uploader.explicit("video_id", {
  resource_type: "video",
  eager: [
    {
      format: "jpg",
      start_offset: "5",
    },
  ],
});
```

**Explanation:** The `explicit` method with eager transformations is the correct approach for generating video thumbnails at specific times. The `start_offset` parameter specifies when in the video to capture the thumbnail, and setting `format: "jpg"` ensures the output is an image rather than a video segment.

15. A - Direct browser-to-Cloudinary upload with upload progress indicator.

**Explanation:** For user-uploaded videos, direct browser-to-Cloudinary upload with progress indication provides the best balance of performance and user experience. This approach bypasses your server for the actual file transfer (improving performance and reducing your bandwidth costs) while giving users visual feedback on the upload progress (improving user experience for large video files).
