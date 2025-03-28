# System achitecture

This quiz focuses on Cloudinary's architecture concepts, implementation strategies, system integration, and best practices.

## Instructions

- Single-choice questions: Select the ONE best answer
- Multi-select questions: Select ALL answers that apply
- Pay attention to code examples and implementation scenarios

---

## Questions

**1. You are implementing Cloudinary in a React application that needs to upload user-generated content directly from the browser. Which approach provides the best security while maintaining performance?**

A) Use the Cloudinary SDK with API key and API secret in the frontend code
B) Implement unsigned uploads with an upload preset configured for specific restrictions
C) Generate signed upload parameters on your backend and pass them to the frontend
D) Store API credentials in environment variables accessible to the React application

**Difficulty:** Medium

**2. Which Cloudinary architecture pattern is most appropriate for an e-commerce platform that needs product images automatically processed for different device sizes upon upload?**

A) Client-side transformations applied at render time
B) Manual transformations applied via the Media Library
C) Upload presets with eager transformations
D) On-the-fly transformations with responsive breakpoints

**Difficulty:** Medium

**3. When implementing a multi-tenant SaaS platform with Cloudinary, which approach best ensures resource isolation between tenant data?**

A) Creating separate Cloudinary accounts for each tenant
B) Using a folder structure with tenant identifiers as prefixes
C) Implementing access control rules based on public IDs
D) Generating unique transformation signatures for each tenant

**Difficulty:** Hard

**4. Which of the following correctly describes the relationship between Cloudinary's delivery URL components?**

A) `[cloud_name].[resource_type].[type]/[transformations]/[version]/[public_id].[format]`
B) `[cloud_name]/[resource_type]/[type]/[transformations]/[version]/[public_id].[format]`
C) `[cloud_name].[cdn]/[resource_type]/[type]/[transformations]/[public_id].[format]`
D) `[resource_type]/[cloud_name]/[type]/[transformations]/[public_id]/[version].[format]`

**Difficulty:** Easy

**5. Which of these approaches would provide the most efficient way to handle video processing for a streaming platform with high upload volumes? (Select all that apply)**

A) Using the Upload API with eager transformations for common formats
B) Implementing adaptive bitrate streaming with HLS/DASH formats
C) Setting up notification webhooks to trigger post-processing workflows
D) Using client-side encoding before uploading to Cloudinary
E) Implementing lazy generation of video transformations

**Difficulty:** Hard

**6. A customer reports slow image loading times in their application, particularly for the first page load. Which Cloudinary features would you recommend to improve performance? (Select all that apply)**

A) Implementing responsive images with srcset and sizes attributes
B) Using the f_auto and q_auto parameters for format and quality optimization
C) Setting up a fetch URL mapping to Cloudinary from the origin server
D) Implementing progressive image loading with blur-up placeholders
E) Using the Global CDN with custom domain mapping

**Difficulty:** Medium

**7. You need to implement a system where images uploaded to Cloudinary are automatically tagged, categorized, and have inappropriate content detected. What is the most efficient architecture for this requirement?**

A) Manual moderation through the Media Library interface
B) Client-side AI analysis before uploading to Cloudinary
C) Webhook-based notifications to trigger analysis after upload
D) Auto-tagging and moderation enabled via upload parameters or presets

**Difficulty:** Medium

**8. Which Cloudinary architecture pattern would be most appropriate for a news organization that needs to rapidly publish breaking news images to their website and mobile apps simultaneously?**

A) Upload directly to the origin server, then sync to Cloudinary via Admin API
B) Client-side uploads with background processing for optimizations
C) Direct uploads to Cloudinary with eager transformations for common sizes
D) Upload to a queue system that processes images sequentially

**Difficulty:** Hard

**9. When implementing Cloudinary in a serverless architecture (e.g., AWS Lambda, Azure Functions), which of these practices should be followed? (Select all that apply)**

A) Initialize the Cloudinary SDK outside the handler function
B) Use connection pooling for Cloudinary API requests
C) Implement caching of common transformation results
D) Use environment variables for storing Cloudinary credentials
E) Avoid complex transformation chains in serverless functions

**Difficulty:** Hard

**10. What is the correct way to implement a secure, time-limited access to a private image in Cloudinary?**

A) Using signed URLs with an expiration timestamp
B) Implementing a custom token-based authorization system
C) Using access control lists (ACLs) in Cloudinary
D) Adding an authentication layer in front of Cloudinary

**Difficulty:** Medium

**11. Which of the following approaches would provide the most cost-effective way to serve responsive images for a high-traffic website? (Select all that apply)**

A) Generate all possible sizes during upload with eager transformations
B) Use client-side resizing with Cloudinary's JavaScript SDK
C) Use the responsive image breakpoints API to identify optimal sizes
D) Implement device detection and serve pre-defined sizes based on the device
E) Use the automatic format and quality optimization (f_auto, q_auto)

**Difficulty:** Medium

**12. You need to implement image upload functionality in a mobile application. Which of these strategies is most appropriate?**

A) Direct upload to Cloudinary from the mobile device with API credentials
B) Upload to your application server first, then to Cloudinary
C) Use signed uploads with pre-signed URLs generated by your backend
D) Use unsigned uploads with strict upload presets for security

**Difficulty:** Easy

**13. When implementing Cloudinary in a globally distributed application, which approach best handles regional data residency requirements?**

A) Using a single Cloudinary account with global CDN distribution
B) Using separate Cloudinary accounts for each geographic region
C) Implementing custom domain mapping with region-specific subdomains
D) Using Cloudinary's Private CDN with geo-restriction rules

**Difficulty:** Hard

**14. What is the best practice for managing Cloudinary transformations in a large-scale application?**

A) Generate all transformations on-the-fly as needed
B) Create named transformations for commonly used transformation chains
C) Precompute all possible transformations at upload time
D) Store transformation strings in the application database

**Difficulty:** Medium

**15. You are integrating Cloudinary with a headless CMS. Which integration pattern provides the most flexibility and performance?**

A) Store only asset public IDs in the CMS and generate URLs in the frontend
B) Store complete Cloudinary URLs in the CMS database
C) Use the CMS's media library exclusively and sync with Cloudinary
D) Implement a middleware service between the CMS and Cloudinary

**Difficulty:** Medium

## Answers

1. C - Generate signed upload parameters on your backend and pass them to the frontend.

**Explanation:** This approach provides the best security because it keeps API secrets on the server-side while allowing direct uploads from the browser. The server generates the necessary signatures with a limited-time validity, and the frontend can upload directly to Cloudinary without ever seeing or storing the API secret.

2. C - Upload presets with eager transformations.

**Explanation:** For e-commerce platforms, this approach ensures that common product image sizes are pre-generated during upload. This eliminates transformation latency when customers browse products, providing a faster shopping experience while still automating the image processing workflow.

3. B - Using a folder structure with tenant identifiers as prefixes.

**Explanation:** This is the most cost-effective and practical approach for multi-tenant systems. By organizing assets in tenant-specific folders (e.g., /tenant-123/), you maintain logical separation while using a single Cloudinary account, reducing management overhead and costs compared to separate accounts per tenant.

4. B - `[cloud_name]/[resource_type]/[type]/[transformations]/[version]/[public_id].[format]`.

**Explanation:** This is the correct structure for Cloudinary URLs. For example: `https://res.cloudinary.com/demo/image/upload/w_500,h_500,c_fill/v1234567890/sample.jpg` where "demo" is the cloud name, "image" is the resource type, "upload" is the type, "w_500,h_500,c_fill" are transformations, and "sample" is the public ID.

5. A - Using the Upload API with eager transformations for common formats.
   B - Implementing adaptive bitrate streaming with HLS/DASH formats.
   C - Setting up notification webhooks to trigger post-processing workflows.

**Explanation:** These three approaches work together to efficiently handle high-volume video processing. Eager transformations pre-generate common formats during upload, adaptive streaming ensures optimal playback across devices and network conditions, and webhooks enable asynchronous processing to handle additional operations without blocking the upload flow.

6. A - Implementing responsive images with srcset and sizes attributes.
   B - Using the f_auto and q_auto parameters for format and quality optimization.
   D - Implementing progressive image loading with blur-up placeholders.

**Explanation:** These techniques work together to improve image loading performance. Responsive images ensure appropriate sizes for each device, f_auto and q_auto deliver the optimal format and quality for each browser, and progressive loading with placeholders creates a better perceived performance by showing content faster while the full-quality images load.

7. D - Auto-tagging and moderation enabled via upload parameters or presets.

**Explanation:** This approach processes images at upload time using Cloudinary's AI capabilities, making tags and moderation results immediately available. It's more efficient than webhook-based solutions that require additional round-trips and manual moderation that creates bottlenecks.

8. C - Direct uploads to Cloudinary with eager transformations for common sizes.

**Explanation:** For breaking news situations where time is critical, direct uploads with eager transformations provide the best balance of speed and optimization. The original upload is immediately available while common transformations are processed in parallel, ensuring fast publishing across platforms.

9. A - Initialize the Cloudinary SDK outside the handler function.
   C - Implement caching of common transformation results.
   D - Use environment variables for storing Cloudinary credentials.
   E - Avoid complex transformation chains in serverless functions.

**Explanation:** These practices optimize Cloudinary usage in serverless environments. Initializing the SDK outside the handler avoids repeated initialization costs, caching reduces API calls, environment variables provide secure credential management, and avoiding complex transformations prevents function timeouts.

10. A - Using signed URLs with an expiration timestamp.

**Explanation:** Signed URLs with expiration timestamps are the standard way to implement time-limited access to private resources in Cloudinary. The signature ensures the URL cannot be tampered with, and the expiration ensures the access is only valid for a specified period.

11. C - Use the responsive image breakpoints API to identify optimal sizes.
    E - Use the automatic format and quality optimization (f_auto, q_auto).

**Explanation:** The responsive breakpoints API analyzes images to determine the optimal set of sizes for different devices, reducing unnecessary transformations. Combined with automatic format and quality optimization, this approach delivers the best balance of visual quality and file size for each user, minimizing bandwidth costs.

12. C - Use signed uploads with pre-signed URLs generated by your backend.

**Explanation:** This provides the best security for mobile applications by keeping API secrets on the server while allowing direct uploads from mobile devices. The server generates time-limited upload signatures that the mobile app can use to upload directly to Cloudinary without storing sensitive credentials.

13. B - Using separate Cloudinary accounts for each geographic region.

**Explanation:** For strict data residency requirements, separate accounts in different regions ensure that assets are stored in compliance with local regulations. This approach provides clear separation of assets and allows precise control over where media is stored, processed, and delivered from.

14. B - Create named transformations for commonly used transformation chains.

**Explanation:** Named transformations improve maintainability by centralizing transformation definitions. Instead of repeating complex transformation strings throughout your code, you define them once and reference them by name. This makes updates easier to manage and ensures consistency across your application.

15. A - Store only asset public IDs in the CMS and generate URLs in the frontend.

**Explanation:** This approach provides the greatest flexibility for headless CMS integrations. By storing only the essential public IDs, you can modify transformation parameters without updating CMS content, allowing you to adapt image delivery to different frontend requirements or improve optimizations over time.
