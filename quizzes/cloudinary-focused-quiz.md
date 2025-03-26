# Cloudinary Focused Quiz: High-Priority Topics

This quiz focuses specifically on the areas where you scored below 80%: System Architecture and Integration, Media Management and Features, and Upload and Transformations.

## Instructions

- Choose the best answer for each question
- Focus on understanding the concepts behind each answer

---

## System Architecture and Integration

**1. When integrating Cloudinary with a web application, which approach provides the most secure way to handle authenticated uploads?**

- A) Use the Upload widget with an unsigned upload preset
- B) Generate a signature on your server and pass it to the client for uploads
- C) Include your API secret in client-side JavaScript code
- D) Use the Media Library widget for all upload operations

**2. Which method is most appropriate for transforming images from an external source without storing them in your Cloudinary account?**

- A) Use the upload API with the public URL
- B) Use fetch URLs with transformation parameters
- C) Use remote URLs with the Media Library
- D) Create a named transformation and apply it to external URLs

**3. A client needs to integrate Cloudinary with their existing content management system. What is the recommended approach if they want to keep their media assets in sync between systems?**

- A) Manually upload assets to both systems
- B) Use server-side SDKs with webhooks to automate synchronization
- C) Export assets from one system and import to the other weekly
- D) Use the Media Library widget embedded in the CMS

**4. Which authentication method should be used when building a mobile application that needs to upload directly to Cloudinary?**

- A) Include API key and secret in the mobile app code
- B) Use unsigned upload presets with restricted functionality
- C) Generate upload signatures on your server and pass them to the app
- D) Use OAuth2 authentication with Cloudinary as the provider

**5. What is the correct approach for implementing a microservice architecture where multiple services need to interact with Cloudinary?**

- A) Each service should have its own Cloudinary account
- B) Create a dedicated API gateway service that handles all Cloudinary operations
- C) Use a shared API key and secret across all services
- D) Create a sub-account for each microservice with appropriate access controls

**6. Which combination of Cloudinary features would be most efficient for an e-commerce site that needs to dynamically generate product images with overlaid pricing information?**

- A) Upload presets with eager transformations for each price point
- B) Text overlays with variables and named transformations
- C) Multiple versions of each image with different text overlays
- D) Client-side rendering of text over base images

**7. When implementing SEO-friendly image URLs with Cloudinary, which approach is recommended?**

- A) Use the SEO suffix feature with descriptive names
- B) Apply custom domain names to all Cloudinary URLs
- C) Use the original filenames as the public IDs
- D) Implement URL redirects from SEO-friendly URLs to Cloudinary URLs

**8. What is the most efficient way to implement real-time image moderation in a user-generated content platform?**

- A) Manual review of all uploads before they become public
- B) Client-side validation using AI before uploading
- C) Use auto-moderation add-ons with webhooks for notification
- D) Implement post-upload batch processing for moderation

**9. For a global enterprise implementing Cloudinary, which architecture provides the best balance of performance and maintainability?**

- A) Multiple Cloudinary accounts for each geographic region
- B) A single account with multi-CDN delivery and delivery profiles
- C) A primary account with multiple sub-accounts for different departments
- D) Separate accounts for development, staging, and production environments

**10. What is the best approach for implementing backup and disaster recovery for Cloudinary assets?**

- A) Regular downloads of all assets to local storage
- B) Enable Cloudinary's backup add-on and configure appropriate retention
- C) Replicate all uploads to a secondary cloud storage provider
- D) Use multiple Cloudinary accounts with synchronized content

## Media Management and Features

**11. Which API technique would you use to generate a time-limited URL for a private asset?**

- A) Create a URL with the private_cdn parameter
- B) Generate a signed URL with an expiration timestamp
- C) Use the secure parameter with an API key
- D) Apply access control lists to the asset URL

**12. What is the most effective way to organize assets for a large marketing team with multiple campaigns?**

- A) Store all assets in a single folder and use tags for campaigns
- B) Create date-based folders for all uploads
- C) Use a combination of folders for campaigns and tags for asset types
- D) Store metadata with campaign information on each asset

**13. Which feature would you implement to allow users to crop their profile pictures during upload?**

- A) Server-side cropping using the Upload API
- B) Client-side crop and scale operations before upload
- C) The Upload widget with the inline_crop mode enabled
- D) The Media Library widget with crop transformation presets

**14. How would you efficiently implement a system that needs to access the dimensions and format of uploaded images?**

- A) Process all images after upload to extract metadata
- B) Use the explicit API to generate this information
- C) Access the asset's metadata directly from the API response
- D) Apply analysis add-ons to extract image information

**15. What is the correct approach to implementing cache control for frequently updated images?**

- A) Set a low TTL value in the delivery profile
- B) Use versioning in the URL to bypass cache
- C) Implement cache invalidation through the API
- D) Use signed URLs with expiration for all assets

**16. Which method would you use to find all video assets longer than 5 minutes in your Cloudinary account?**

- A) List all video assets and filter client-side by duration
- B) Use the search API with an expression filtering for duration
- C) Create a saved search in the Media Library
- D) Apply auto-tagging for video duration and search by tag

**17. What is the most efficient way to apply the same set of tags to hundreds of existing assets?**

- A) Update each asset individually with new tags
- B) Use the add tag operation with multiple public IDs
- C) Re-upload the assets with tags parameter
- D) Export and import the asset list with updated tags

**18. For a digital asset management workflow that requires approval stages, what is the recommended implementation?**

- A) Create separate folders for each approval stage
- B) Use metadata to track approval status and configure access control
- C) Implement an external approval system that uses Cloudinary's API
- D) Use tag-based workflows with notification URLs

**19. How would you implement a solution that automatically detects and removes duplicate images in a Cloudinary account?**

- A) Use the admin API to list all assets and compare hashes
- B) Apply auto-tagging with the similarity detection feature
- C) Create a custom script that uses the search API with perceptual hashing
- D) Enable duplicate detection in the upload preset

**20. What is the best approach for managing different image quality settings across multiple types of content?**

- A) Use q_auto for all assets
- B) Create named transformations with different quality settings
- C) Configure default image quality per folder
- D) Use delivery profiles with quality parameters

## Upload and Transformations

**21. Which transformation approach would be most efficient for creating responsive images with art direction (different crops for different devices)?**

- A) Use the g_auto parameter with different widths
- B) Create separate named transformations for each device type
- C) Use the responsive_breakpoints parameter with different transformations
- D) Apply client-side cropping based on screen size

**22. What is the best practice for protecting private transformations that should only be accessible to paying customers?**

- A) Use signed URLs with token authentication
- B) Apply watermarks to all transformed images
- C) Store transformations in your application database
- D) Use separate Cloudinary accounts for free and paid content

**23. For a website that needs to display user-uploaded PDF documents as images, what is the recommended transformation approach?**

- A) Convert PDFs to images during upload using eager transformations
- B) Use the page parameter to extract specific pages as needed
- C) Extract all pages during upload and store them as separate assets
- D) Convert PDFs to images client-side before uploading

**24. Which transformation would be most appropriate for optimizing a large hero image on a website homepage?**

- A) `c_scale,w_1920,q_auto:good,f_auto`
- B) `c_fill,w_1920,h_800,g_auto,q_auto:eco,f_auto`
- C) `c_limit,w_2000,q_auto,dpr_auto`
- D) `c_pad,w_1920,h_800,b_auto,q_80`

**25. A client needs to create animated thumbnails from their videos. Which approach is most efficient?**

- A) Extract frames with the page parameter and create a client-side animation
- B) Use the video to animated GIF transformation
- C) Create multiple thumbnails and implement client-side animation
- D) Upload a separate thumbnail animation for each video

**26. What is the recommended way to handle image assets that need different focal points for different aspect ratios?**

- A) Upload multiple versions of the image with different crops
- B) Use g_auto with different aspect ratios
- C) Set custom coordinates for the image and use g_custom
- D) Create separate transformations with manual gravity settings

**27. When implementing the Upload widget for a site with sensitive content, which configuration provides the best security?**

- A)

```javascript
cloudinary.createUploadWidget(
  {
    cloudName: "demo",
    uploadPreset: "ml_default",
    folder: "secure",
  },
  callback
);
```

- B)

```javascript
cloudinary.createUploadWidget(
  {
    cloudName: "demo",
    apiKey: "your_api_key",
    folder: "secure",
    secure: true,
  },
  callback
);
```

- C)

```javascript
cloudinary.createUploadWidget(
  {
    cloudName: "demo",
    uploadPreset: "secure_preset",
    folder: "secure",
    secure: true,
    sources: ["local", "camera"],
  },
  callback
);
```

- D)

```javascript
cloudinary.createUploadWidget(
  {
    cloudName: "demo",
    uploadSignatureTimestamp: timestamp,
    uploadSignature: signature,
    folder: "secure",
    secure: true,
    sources: ["local", "camera"],
  },
  callback
);
```

**28. What is the most effective way to implement face pixelation for privacy in user-uploaded images?**

- A) Apply client-side pixelation before upload
- B) Use the pixelate_faces effect with the Upload API
- C) Use the face detection add-on with a pixelation transformation
- D) Implement manual face detection and apply regional pixelation

**29. When working with a large number of video assets, what is the most efficient approach for generating thumbnails?**

- A) Use eager transformations to generate thumbnails during upload
- B) Generate thumbnails on-demand using the video thumbnail transformation
- C) Extract frames from videos using the frame parameter
- D) Use the video player's poster option to generate thumbnails

**30. For an e-commerce site that needs to show products on various background colors, what is the most efficient implementation?**

- A) Upload separate versions of each product with different backgrounds
- B) Use background removal and apply transparent backgrounds
- C) Remove backgrounds and apply b_rgb: parameters with color codes
- D) Use chroma key transformations to change background colors client-side

### Answers

1- b
2- b
3- b
4- c
5- b
6- b
7- a
8- c
9- c
10- b
11- b
12- c
13- c
14- c
15- c
16- b
17- b
18- b
19- c
20- b
21- c
22- a
23- a
24- b
25- b
26- c
27- d
28- c
29- b
30- c

Performance by Topic Area:

System Architecture and Integration (Q1-10): 5/10 correct (50%)
Media Management and Features (Q11-20): 5/10 correct (50%)
Upload and Transformations (Q21-30): 8/10 correct (80%)
