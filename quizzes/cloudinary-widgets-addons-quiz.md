# Widgets, Add-ons, and Custom Integrations

This quiz focuses on Cloudinary's widgets, out-of-the-box add-ons, and custom integration patterns.

## Instructions

- Single-choice questions: Select the ONE best answer
- Multi-select questions: Select ALL answers that apply
- Pay attention to code examples and implementation details

---

## Questions

**1. Which of these Cloudinary widgets allows users to both upload assets and browse the Media Library?**

A) Upload Widget
B) Product Gallery Widget
C) Media Library Widget
D) Cloudinary Console Widget

**Difficulty:** Easy

**2. When implementing the Cloudinary Upload Widget, which parameter is required for secure authentication?**

A) api_key
B) cloud_name
C) upload_preset
D) signature

**Difficulty:** Medium

**3. Which code snippet correctly implements a signed Upload Widget with authentication?**

A)

```javascript
// Client-side code
cloudinary.createUploadWidget(
  {
    cloudName: "demo",
    apiKey: "123456789012345",
    apiSecret: "abcdefghijklmnopqrstuvwxyz",
    uploadPreset: "my_preset",
  },
  (error, result) => {
    console.log(result);
  }
);
```

B)

```javascript
// Client-side code
cloudinary.createUploadWidget(
  {
    cloudName: "demo",
    apiKey: "123456789012345",
    uploadPreset: "my_preset",
  },
  (error, result) => {
    console.log(result);
  }
);
```

C)

```javascript
// Server-side code generates signature
const signature = cloudinary.utils.api_sign_request(
  {
    timestamp: Math.round(new Date().getTime() / 1000),
  },
  apiSecret
);

// Client-side code
cloudinary.createUploadWidget(
  {
    cloudName: "demo",
    apiKey: "123456789012345",
    uploadSignature: signature,
    uploadSignatureTimestamp: timestamp,
  },
  (error, result) => {
    console.log(result);
  }
);
```

D)

```javascript
// Client-side code
cloudinary.createUploadWidget(
  {
    cloudName: "demo",
    uploadPreset: "my_preset",
    unsigned: true,
  },
  (error, result) => {
    console.log(result);
  }
);
```

**Difficulty:** Hard

**4. Which of the following Cloudinary add-ons can automatically tag uploaded images with appropriate keywords? (Select all that apply)**

A) Google Auto Tagging
B) Amazon Rekognition Auto Tagging
C) Imagga Auto Tagging
D) Clarifai Auto Tagging
E) Microsoft Computer Vision Auto Tagging

**Difficulty:** Medium

**5. When implementing the Cloudinary Media Library widget, which of these methods correctly handles the asset selection event?**

A)

```javascript
const myWidget = cloudinary.createMediaLibrary(
  {
    cloud_name: "demo",
    api_key: "123456789012345",
    multiple: true,
  },
  {
    insertHandler: function (data) {
      console.log("Assets selected:", data.assets);
    },
  }
);
```

B)

```javascript
const myWidget = cloudinary.createMediaLibrary(
  {
    cloud_name: "demo",
    api_key: "123456789012345",
    multiple: true,
  },
  function (data) {
    console.log("Assets selected:", data.assets);
  }
);
```

C)

```javascript
const myWidget = cloudinary.openMediaLibrary({
  cloud_name: "demo",
  api_key: "123456789012345",
  multiple: true,
  onSelect: function (data) {
    console.log("Assets selected:", data.assets);
  },
});
```

D)

```javascript
const myWidget = cloudinary.MediaLibrary(
  {
    cloud_name: "demo",
    api_key: "123456789012345",
    multiple: true,
  },
  {
    onSuccess: function (data) {
      console.log("Assets selected:", data.assets);
    },
  }
);
```

**Difficulty:** Hard

**6. Which Cloudinary add-on would you recommend for automatically detecting and removing the background from product images?**

A) Imagga Auto Tagging
B) WebPurify Image Moderation
C) Cloudinary AI Background Removal
D) Remove.bg Background Removal

**Difficulty:** Easy

**7. When implementing the Product Gallery widget, what is the correct way to handle zoom functionality?**

A) Enable the zoom plugin and customize with zoom-related options
B) Add a click event listener to implement custom zoom behavior
C) Set the carouselZoom parameter to true in the configuration
D) Include the zoom transformation parameters in the source URLs

**Difficulty:** Medium

**8. Which of these integration patterns is most appropriate for a headless CMS using Cloudinary? (Select all that apply)**

A) Store asset public IDs in the CMS and construct URLs at runtime
B) Integrate the Cloudinary Media Library widget for content editors
C) Store complete asset URLs in the CMS database
D) Use the Cloudinary Upload Widget for user-generated content
E) Implement Cloudinary fetch URLs to automatically deliver CMS assets

**Difficulty:** Medium

**9. To implement a custom authentication flow for the Media Library widget, which of these approaches is recommended?**

A) Set up OAuth2 flow directly in the widget configuration
B) Implement a server-side endpoint that generates a signed request
C) Use Cloudinary's built-in JWT authentication for widgets
D) Include authentication credentials directly in the widget initialization

**Difficulty:** Hard

**10. Which code snippet correctly implements a Cloudinary Video Player with adaptive streaming?**

A)

```javascript
const player = cld.videoPlayer("video-player", {
  cloud_name: "demo",
  publicId: "dog",
  sourceTypes: ["hls", "dash", "mp4"],
  autoplayMode: "always",
});
```

B)

```javascript
const player = cloudinary.videoPlayer("video-player");
player.source("dog", {
  sourceTypes: ["hls", "dash", "mp4"],
  transformation: { streaming_profile: "hd" },
});
```

C)

```javascript
const player = cloudinary.createVideoPlayer("video-player", {
  sources: [
    {
      type: "hls",
      url: "https://res.cloudinary.com/demo/video/upload/sp_hd/dog.m3u8",
    },
    {
      type: "mp4",
      url: "https://res.cloudinary.com/demo/video/upload/dog.mp4",
    },
  ],
});
```

D)

```javascript
const player = cld.videoPlayer("video-player", {
  cloud_name: "demo",
  sourceTypes: ["mp4"],
  adaptive: true,
});
player.source("dog");
```

**Difficulty:** Hard

**11. Which add-on would you implement for automated content moderation of user-generated images? (Select all that apply)**

A) AWS Rekognition Moderation
B) WebPurify Image Moderation
C) Google Vision Safe Search
D) Imagga Auto Tagging
E) MetaDefender Malware Detection

**Difficulty:** Medium

**12. When implementing a custom integration between Cloudinary and a mobile app, which of these approaches provides the best balance of security and performance?**

A) Generating signed upload URLs on your backend server for the mobile app to use
B) Storing API credentials in the mobile app's secure storage
C) Using an unsigned upload preset with limited capabilities
D) Proxying all Cloudinary requests through your backend API

**Difficulty:** Medium

**13. Which parameters would you use to configure the Upload Widget to only accept specific file types and limit the maximum file size? (Select all that apply)**

A) sources
B) maxFileSize
C) clientAllowedFormats
D) resourceType
E) maxImageWidth

**Difficulty:** Medium

**14. What is the best way to customize the appearance of the Media Library widget to match your application's branding?**

A) Apply CSS overrides to the widget container
B) Use the theme parameter with color customization options
C) Create a custom widget template with your own HTML structure
D) Set the style parameter with CSS-in-JS object properties

**Difficulty:** Easy

**15. When integrating Cloudinary with a WordPress site, which approach provides the most comprehensive integration?**

A) Manually adding Cloudinary URLs to each image
B) Installing and configuring the official Cloudinary plugin
C) Using a third-party media management plugin
D) Implementing a custom solution with the Cloudinary PHP SDK

**Difficulty:** Easy

## Answers

1. A - The Upload Widget allows both uploading assets and browsing the Media Library, making it a versatile tool for content management.

2. C - The upload_preset parameter is required for authentication in the Upload Widget, as it defines the preset that includes the authentication settings.

3. C - This correctly implements a signed Upload Widget with proper authentication using a server-generated signature, which is more secure than client-side authentication.

4. B, C, E - Amazon Rekognition, Imagga, and Microsoft Computer Vision all provide auto-tagging add-ons that integrate with Cloudinary to automatically tag uploaded images.

5. A - This correctly handles the asset selection event using the insertHandler callback, which is the proper way to respond when users select assets from the Media Library.

6. D - The Remove.bg add-on is specifically designed for automatic background removal from product images with high quality results.

7. A - The Product Gallery widget requires enabling the zoom plugin and customizing it with zoom-related options to provide proper image zoom functionality.

8. A, B - Storing public IDs and integrating the Media Library widget are best practices for headless CMS integrations, providing flexibility and a better editing experience.

9. B - Implementing a server-side endpoint for generating signed requests is the recommended secure approach for custom authentication flows.

10. B - This correctly implements a Video Player with adaptive streaming using sourceTypes and streaming_profile to deliver the optimal video format based on viewing conditions.

11. A, B, C - AWS Rekognition, WebPurify, and Google Vision Safe Search are all suitable add-ons for content moderation, helping to filter inappropriate images.

12. A - Generating signed upload URLs on your backend server is the most secure approach for mobile app integration, preventing unauthorized uploads.

13. B, C - maxFileSize and clientAllowedFormats are configuration options used to restrict file types and sizes in the Upload Widget.

14. B - The theme parameter allows for customizing the appearance of the Media Library widget to match your application's branding.

15. B - Installing and configuring the official Cloudinary plugin provides the most comprehensive integration for WordPress, automatically handling transformations and delivery optimization.
