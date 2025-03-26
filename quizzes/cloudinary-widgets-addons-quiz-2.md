# Widgets, Add-ons, and Custom Integrations

This quiz covers Cloudinary's pre-built widgets, add-on features, and approaches to custom integrations.

## Questions

**1. In what scenario would you recommend using a custom UI integration instead of Cloudinary's Media Library widget?**

A) When a basic file upload and selection interface is sufficient
B) When deep integration with an existing content management system is required
C) When users need to apply image transformations during asset selection
D) When social sharing features need to be built into the UI

**Difficulty:** Medium

**2. What Cloudinary add-on would help automate the moderation of user-generated content?**

A) Intuitive Crop
B) Responsive Image Breakpoints
C) AI Tagging and Moderation  
D) Facial Attributes Detection

**Difficulty:** Easy

**3. How can you leverage the Cloudinary Media Library widget to enable DAM functionality within an application? (Select up to 2)**

A) Embed the widget as an iframe for a quick integration  
B) Customize the widget's look and feel to match the application's branding
C) Configure the widget to allow asset tagging, categorization, and searching
D) Modify the widget's source code to add custom features

**Difficulty:** Medium

**4. What is the primary benefit of using Cloudinary's image optimization add-ons?**

A) Improved website accessibility
B) Faster image downloads and rendering
C) Automatic image backups and versioning  
D) Enhanced image editing capabilities

**Difficulty:** Easy

**5. How would you integrate Cloudinary's upload functionality into a React application? (Code-based question)**

A) `import { CloudinaryUploadWidget } from 'cloudinary-react';`
B) `const cloudinary = require('cloudinary').v2;`  
C) `import { Cloudinary } from '@cloudinary/url-gen';`
D) `const { CloudinaryImage } from 'cloudinary-core';`

**Difficulty:** Hard

**6. What is the main advantage of using Cloudinary's video player over native HTML5 video?**

A) Automatic generation of video thumbnails
B) Cross-browser compatibility and adaptive bitrate streaming
C) Built-in video editing and transformation capabilities
D) Support for panoramic and 360-degree video formats

**Difficulty:** Medium

**7. How can you optimize the delivery of responsive images using Cloudinary? (Select up to 2)**

A) Manually create and upload multiple image sizes for each breakpoint
B) Use Cloudinary's responsive image breakpoints add-on to automate the process  
C) Serve a single high-resolution image and let the browser handle resizing
D) Dynamically generate responsive image URLs with specific width and height parameters

**Difficulty:** Medium

**8. What is the purpose of Cloudinary's upload presets?**

A) To define a set of predefined transformations to apply during image upload
B) To specify default upload options and access control permissions  
C) To automatically categorize uploaded assets based on their content
D) To generate unique identifiers for each uploaded asset

**Difficulty:** Easy

**9. How would you dynamically generate a Cloudinary URL to resize an uploaded image to a width of 800 pixels while maintaining aspect ratio? (Code-based question)**

A) `cloudinary.url('sample.jpg', { width: 800, height: 'auto', crop: 'scale' })`
B) `cloudinary.url('sample.jpg', { width: 800, crop: 'fit' })`
C) `cloudinary.url('sample.jpg', { resize: { width: 800 } })`  
D) `cloudinary.url('sample.jpg', { transformation: [{ width: 800, height: 800, crop: 'fill' }] })`

**Difficulty:** Hard

**10. What is the main benefit of using Cloudinary's asset versioning and revision history?**

A) Automatic backup and disaster recovery
B) Easy rollback and comparison of asset changes over time
C) Reduced storage costs through asset deduplication  
D) Improved collaboration with real-time asset editing

**Difficulty:** Medium

**11. How can you leverage Cloudinary's AI-based add-ons to enhance image search capabilities? (Select up to 2)**

A) Automatically generate descriptive alt tags for images
B) Extract dominant colors from images to enable color-based searching  
C) Detect and identify objects, faces, and text within images
D) Manually assign relevant keywords to each uploaded image

**Difficulty:** Hard

**12. What is the purpose of Cloudinary's Strict Transformations feature in the context of add-ons and integrations?**

A) To enforce specific naming conventions for transformed assets  
B) To limit the usage of certain add-ons and integrations based on plan limits
C) To prevent unauthorized access to sensitive asset transformations
D) To ensure compatibility between different add-ons and integrations

**Difficulty:** Medium

**13. How would you integrate Cloudinary's image transformation capabilities into a server-side Node.js application? (Code-based question)**

A) `const cloudinary = require('cloudinary').v2;`
B) `import { Cloudinary } from '@cloudinary/url-gen';`
C) `const { CloudinaryImage } = require('cloudinary-core');`
D) `import { CloudinaryUploadWidget } from 'cloudinary-react';`

**Difficulty:** Hard

**14. What is the main advantage of using Cloudinary's media authentication add-on?**

A) Improved asset discoverability through advanced metadata tagging
B) Automatic watermarking of protected assets
C) Secure access control and token-based asset authorization
D) Built-in support for DRM and encrypted asset delivery

**Difficulty:** Medium

**15. How can you extend Cloudinary's capabilities to support custom asset transformations and processing?**

A) Develop and deploy custom Functions-as-a-Service (FaaS) using Cloudinary Functions
B) Modify Cloudinary's internal codebase and submit a pull request
C) Create a custom add-on using Cloudinary's Add-on Framework
D) Integrate third-party libraries and services via webhooks

**Difficulty:** Hard
