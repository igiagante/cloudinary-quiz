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

**6. Given this Media Library widget configuration object:
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
What is the expected behavior when opened?**
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
  invalidate: true
});
```
- B) 
```javascript
cloudinary.api.delete_resources(["image_id"], {
  invalidate: true
});
```
- C) 
```javascript
cloudinary.v2.api.purge_cache({
  public_id: "image_id"
});
```
- D) 
```javascript
cloudinary.v2.uploader.explicit("image_id", {
  invalidate: true
});
```

---

## Section 4: Additional Questions

**14. A client wants to apply an Unsigned upload preset for user uploads. In which scenario would this be appropriate?**
- A) For a private internal application where all users are authenticated
- B) For highly sensitive document uploads in a financial application
- C) For a public-facing website where users can upload profile pictures
- D) For a secure enterprise document management system

**15. What is the purpose of strict transformations settings in Cloudinary?**
- A) To ensure all transformations use the best quality settings
- B) To restrict which transformations can be applied to assets
- C) To enforce image size limitations
- D) To automatically apply transformations to all uploaded assets

---

## Answers

1. B
2. B
3. C
4. C
5. B
6. B
7. A
8. C
9. C
10. A
11. B
12. C
13. D
14. C
15. B

## Explanations

1. Cloudinary's core value proposition is providing end-to-end media management including upload, storage, administration, manipulation, optimization and delivery.

2. Responsive image syntax with breakpoints is Cloudinary's recommended approach for responsive images as it automatically delivers the optimal size based on the device.

3. The "v1312461204" part of the URL represents the version of the asset.

4. Cloudinary's multi-CDN architecture automatically routes traffic through the best performing CDN for each region without manual configuration.

5. The Upload widget is specifically designed to allow users to upload files directly from their browser to Cloudinary.

6. The configuration restricts selection to a single image from the 'products' folder due to the 'multiple: false', 'max_files: 1', and 'resource_type: image' settings.

7. The correct API endpoint for creating subaccounts is POST /admin/sub_accounts.

8. The 'scrubThumbnails: true' parameter enables preview thumbnails when scrubbing through the video timeline.

9. Cloudinary's built-in backup storage feature is the most cost-effective backup solution for large volumes of assets.

10. The restore API method is used to recover deleted assets within the configured timeframe.

11. Metadata is best for structured data with specific types, while tags are better for simple grouping and filtering.

12. The delete_resources_by_tag API allows bulk deletion of assets that share a specific tag.

13. The explicit API with invalidate:true is the correct way to invalidate the cache for an asset.

14. Unsigned upload presets are appropriate for public-facing applications like profile picture uploads where the security risk is low.

15. Strict transformation settings restrict which transformations can be applied to assets, helping prevent unauthorized or expensive transformations.
