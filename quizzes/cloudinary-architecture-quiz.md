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

1. C - Generating signed upload parameters on your backend and passing them to the frontend provides security without exposing API credentials in client-side code.
2. C - Upload presets with eager transformations automatically process images during upload for predefined sizes and formats.
3. B - Using a folder structure with tenant identifiers as prefixes is the most common and cost-effective approach for multi-tenant isolation.
4. B - The correct Cloudinary URL structure is cloud_name/resource_type/type/transformations/version/public_id.format.
5. A, B, C - Using the Upload API with eager transformations, implementing adaptive bitrate streaming, and setting up webhooks for post-processing workflows all help manage high-volume video processing efficiently.
6. A, B, D - Responsive images, auto format/quality, and progressive loading all contribute to better performance.
7. D - Enabling auto-tagging and moderation via upload parameters or presets is the most efficient approach.
8. C - Direct uploads to Cloudinary with eager transformations for common sizes provides the best balance of speed and optimization for rapidly publishing breaking news.
9. A, C, D, E - Initializing outside the handler, caching transformations, using environment variables, and avoiding complex transformations are all best practices for serverless environments.
10. A - Signed URLs with expiration timestamps are the standard way to implement time-limited access to private resources.
11. C, E - Using the responsive breakpoints API and automatic format/quality optimization provide the most cost-effective approach.
12. C - Using signed uploads with pre-signed URLs generated by your backend provides the best security for mobile applications.
13. B - Using separate Cloudinary accounts for each geographic region is the most appropriate approach for strict data residency requirements.
14. B - Creating named transformations for common transformation chains improves reusability and maintenance.
15. A - Storing only public IDs and generating URLs in the frontend provides flexibility to change transformations without updating CMS content.
