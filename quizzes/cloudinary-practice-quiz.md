# Cloudinary Certification Practice Quiz

This practice quiz focuses on the areas where you need the most improvement: Products, Value, Environment Settings, Implementation Strategies, Widgets, Add-ons, Custom Integrations, and Media Management.

## Instructions

- Choose the best answer for each question
- After completing all questions, check your answers at the end
- Take notes on any concepts you're still unsure about

---

## Section 1: Products, Value, Environment Settings, and Implementation Strategies

**1. Which of the following best describes Cloudinary's value proposition?**

- A) A storage solution exclusively for image files
- B) An end-to-end media management solution including upload, storage, administration, manipulation, optimization and delivery
- C) A platform solely for video transcoding and streaming
- D) A content delivery network (CDN) for static assets

**2. A client needs to implement responsive images that automatically adapt to different screen sizes. Which implementation strategy should you recommend?**

- A) Create multiple image versions manually and use JavaScript to detect screen size
- B) Use Cloudinary's responsive breakpoints and the responsive image syntax
- C) Create separate URLs for each possible device width
- D) Simply use the w_auto parameter for all images

**3. Given this Cloudinary URL structure: `https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg`, which component represents the version?**

- A) demo
- B) upload
- C) v1312461204
- D) sample

**4. Which of the following is the correct implementation of multi-CDN architecture in Cloudinary?**

- A) Manually routing requests to different CDNs using JavaScript
- B) Using multiple Cloudinary accounts, each configured with a different CDN
- C) Cloudinary automatically selects the best performing CDN for each region
- D) Using the CDN override parameter on each URL

---

## Section 2: Widgets, Out of Box Add-ons, Custom Integrations

**5. A client needs to allow their users to upload media files directly from their browser to Cloudinary. Which widget would you recommend?**

- A) Media Library widget
- B) Upload widget
- C) Product Gallery widget
- D) Video Player widget

\*\*6. Given this Media Library widget configuration object:

```javascript
{
  cloud_name: 'demo',
  multiple: false,
  max_files: 1,
  folder: {
    path: 'products',
    resource_type: 'image'
  }
}
```

What is the expected behavior when opened?\*\*

- A) It will allow the user to select multiple images from any folder
- B) It will allow the user to select a single image only from the 'products' folder
- C) It will allow the user to select a single file of any type from the 'products' folder
- D) It will show the contents of the 'products' folder but not allow selection

**7. Which of the following is the correct provisioning API request to create a new sub-account?**

- A) `POST /admin/sub_accounts`
- B) `PUT /admin/create_subaccount`
- C) `POST /v1/admin/subaccounts`
- D) `POST /admin/users/subaccount`

**8. When configuring the Cloudinary Video Player, which configuration parameter controls the automatic generation of preview thumbnails?**

- A) `thumbnails: true`
- B) `showJumpControls: true`
- C) `scrubThumbnails: true`
- D) `previewThumbnails: true`

---

## Section 3: Media Management

**9. Which option would have the lowest cost implications for backing up large volumes of assets?**

- A) Multiple active Cloudinary instances
- B) Downloading all assets to local storage
- C) Using Cloudinary's backup storage feature
- D) Creating derived versions of all assets

**10. Which API method should be used to restore assets programmatically after deletion?**

- A) `cloudinary.api.restore([public_ids])`
- B) `cloudinary.api.recover([public_ids])`
- C) `cloudinary.api.undelete([public_ids])`
- D) `cloudinary.api.retrieve([public_ids])`

**11. When would you recommend using metadata instead of tags for asset organization?**

- A) When you need to group assets for batch operations
- B) When you need structured, searchable data with specific data types
- C) When you need quick visual filtering in the Media Library
- D) When you need to apply the same transformation to multiple assets

**12. Given a scenario where a client needs to bulk delete assets that match certain criteria, which API would you recommend?**

- A) `cloudinary.api.delete_by_prefix('folder/prefix')`
- B) `cloudinary.api.delete_all()`
- C) `cloudinary.api.delete_resources_by_tag('tag')`
- D) `cloudinary.api.delete_folder('folder')`

**13. Which code snippet would correctly invalidate the cache for a transformed image?**

- A)

```javascript
cloudinary.api.update("image_id", {
  invalidate: true,
});
```

- B)

```javascript
cloudinary.api.delete_resources(["image_id"], {
  invalidate: true,
});
```

- C)

```javascript
cloudinary.v2.api.purge_cache({
  public_id: "image_id",
});
```

- D)

```javascript
cloudinary.v2.uploader.explicit("image_id", {
  invalidate: true,
});
```

---

## Section 4: Additional Questions

**14. A client wants to apply an Unsigned upload preset for user uploads. In which scenario would this be appropriate?**

- A) For a private internal application where all users are authenticated
- B) For highly sensitive document uploads in a financial application
- C) For a public-facing website where users can upload profile pictures
- D) For a secure enterprise document management system

**15. What is the purpose of Cloudinary's "strict transformations" setting?**

- A) To ensure transformations are applied in the correct order
- B) To restrict which transformations can be applied to your assets
- C) To improve transformation performance
- D) To enforce a specific image quality level

## Answers

1. B - An end-to-end media management solution including upload, storage, administration, manipulation, optimization and delivery.

**Explanation:** This accurately describes Cloudinary's comprehensive offering across the entire media lifecycle. Unlike options that focus on individual aspects, Cloudinary provides a complete solution for all media management needs.

2. B - Use Cloudinary's responsive breakpoints and the responsive image syntax.

**Explanation:** This is Cloudinary's recommended approach for responsive images as it automatically generates optimal image sizes for different devices and leverages the HTML5 srcset and sizes attributes for responsive delivery.

3. A - demo.

**Explanation:** In the URL structure `https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg`, "demo" is the cloud name that identifies the specific Cloudinary account. "v1312461204" is the version number, not the cloud name.

4. C - Cloudinary automatically selects the best performing CDN for each region.

**Explanation:** Cloudinary's multi-CDN architecture works automatically without manual configuration. The system dynamically routes traffic through the optimal CDN based on performance, availability, and geographic location of the user.

5. B - Upload widget.

**Explanation:** The Cloudinary Upload widget is specifically designed for direct browser-to-cloud uploads, handling file selection, preview, upload progress, and direct transmission to Cloudinary.

6. B - It will allow the user to select a single image only from the 'products' folder.

**Explanation:** The configuration restricts selection to a single file (`multiple: false, max_files: 1`), specifically images only (`resource_type: 'image'`), and only from the 'products' folder (`folder: {path: 'products'}`).

7. A - `POST /admin/sub_accounts`.

**Explanation:** This is the correct API endpoint for creating sub-accounts in Cloudinary. The other options either use incorrect HTTP methods or incorrect URL paths according to Cloudinary's API documentation.

8. C - `scrubThumbnails: true`.

**Explanation:** The `scrubThumbnails` parameter enables preview thumbnails when scrubbing through the video timeline in the Cloudinary Video Player, providing visual cues of content at different points in the video.

9. C - Using Cloudinary's backup storage feature.

**Explanation:** Cloudinary's built-in backup feature is the most cost-effective option as it automatically stores assets at a lower cost than maintaining duplicate active environments or creating multiple derived versions.

10. A - `cloudinary.api.restore([public_ids])`.

**Explanation:** The `restore` API method is specifically designed to recover deleted assets within the configured timeframe. The other methods either don't exist or serve different purposes in the API.

11. B - When you need structured, searchable data with specific data types.

**Explanation:** Metadata supports structured data with defined data types (string, integer, date, etc.) and advanced search capabilities, while tags are simpler string-based identifiers better suited for basic grouping.

12. C - `cloudinary.api.delete_resources_by_tag('tag')`.

**Explanation:** This API method allows for bulk deletion of assets that share a specific tag, making it ideal for managing groups of related assets. The other methods either delete by different criteria or perform other operations.

13. D - The code using `cloudinary.v2.uploader.explicit("image_id", { invalidate: true })`.

**Explanation:** The `explicit` API with the `invalidate: true` parameter is the correct way to force Cloudinary to invalidate the CDN cache for an asset, ensuring that the latest version is served to users.

14. A - For a private internal application where all users are authenticated.

**Explanation:** Unsigned upload presets are appropriate in controlled environments where all users are authenticated and the risk of abuse is low. For public-facing applications, signed uploads provide better security and control.

15. B - To restrict which transformations can be applied to your assets.

**Explanation:** Strict transformations settings allow you to control which transformations can be applied to your assets, preventing unauthorized or potentially expensive operations that could impact performance or cost.
