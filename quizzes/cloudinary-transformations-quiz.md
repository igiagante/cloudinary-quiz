# Transformations

This quiz focuses on Cloudinary's transformation capabilities, syntax, chaining, and best practices for image and video manipulations.

## Instructions

- Single-choice questions: Select the ONE best answer
- Multi-select questions: Select ALL answers that apply
- Pay attention to code and URL examples in the questions

---

## Questions

**1. Which transformation parameter would you use to automatically adjust an image to best fit within specific dimensions while maintaining its aspect ratio?**

A) c_scale
B) c_fill
C) c_fit
D) c_limit

**Difficulty:** Easy

**2. When applying multiple transformations to an image, what is the correct order of operations in the transformation URL?**

A) Transformations are applied from left to right in the URL
B) Transformations are applied from right to left in the URL
C) Transformations are applied in order of their priority regardless of position
D) Transformations are automatically optimized by Cloudinary regardless of order

**Difficulty:** Medium

**3. Which of these transformation chains will crop a square region from the center of an image and then resize it to 300x300 pixels?**

A)

```
c_crop,w_500,h_500,g_center/c_scale,w_300,h_300
```

B)

```
c_scale,w_300,h_300/c_crop,w_500,h_500,g_center
```

C)

```
c_fill,w_300,h_300,g_center
```

D)

```
c_fit,w_300,h_300/c_crop,g_center
```

**Difficulty:** Medium

**4. Which transformation parameters would be used to automatically optimize image quality and format based on the user's browser and device? (Select all that apply)**

A) q_auto
B) f_auto
C) dpr_auto
D) w_auto
E) c_auto

**Difficulty:** Easy

**5. You want to apply a named transformation called "profile_thumbnail" and then add a border to the result. Which URL syntax is correct?**

A)

```
t_profile_thumbnail/bo_3px_solid_rgb:D5D5D5
```

B)

```
bo_3px_solid_rgb:D5D5D5/t_profile_thumbnail
```

C)

```
t[profile_thumbnail]/bo_3px_solid_rgb:D5D5D5
```

D)

```
t.profile_thumbnail/bo_3px_solid_rgb:D5D5D5
```

**Difficulty:** Medium

**6. Which JavaScript code snippet correctly applies a sepia effect, rounds the corners, and adds a border to an image using the Cloudinary SDK?**

A)

```javascript
cloudinary.url("sample.jpg", {
  transformation: [
    { effect: "sepia" },
    { radius: 20 },
    { border: "5px_solid_rgb:FF0000" },
  ],
});
```

B)

```javascript
cloudinary.url("sample.jpg", {
  effect: "sepia",
  radius: 20,
  border: "5px_solid_rgb:FF0000",
});
```

C)

```javascript
cloudinary
  .url("sample.jpg")
  .effect("sepia")
  .radius(20)
  .border("5px_solid_rgb:FF0000");
```

D)

```javascript
cloudinary.image("sample.jpg", {
  transformation: [
    { effect: "sepia", radius: 20, border: "5px_solid_rgb:FF0000" },
  ],
});
```

**Difficulty:** Hard

**7. Which of these transformations would properly optimize an image for a responsive website supporting both high-DPR (Retina) devices and regular displays?**

A)

```
w_auto,c_scale,dpr_auto,q_auto
```

B)

```
w_500,c_scale,dpr_auto,q_auto
```

C)

```
w_auto,dpr_auto
```

D)

```
c_scale,w_500,dpr_1.0_2.0,q_auto
```

**Difficulty:** Medium

Here's the question written in Markdown format:

**8. When applying text overlays to an image using Cloudinary's transformation URL API, which of these parameters are required? (Select all that apply)**

A) `text`
B) `color`  
C) `gravity`
D) `font_family`
E) `font_size`

**Difficulty:** Hard

**9. You want to deliver an image that is 800 pixels wide on desktop, 500 pixels on tablets, and 300 pixels on mobile without creating multiple transformations. Which of these approaches is most efficient?**

A) Use responsive breakpoints API to generate optimal widths
B) Use client-side JavaScript to detect device and change the URL
C) Use the srcset attribute with multiple Cloudinary URLs
D) Use a single transformation with w_auto,dpr_auto parameters

**Difficulty:** Medium

**10. Which transformation will crop the image to focus on detected faces and then apply a sepia effect?**

A)

```
c_crop,g_faces/e_sepia
```

B)

```
e_sepia/c_crop,g_faces
```

C)

```
c_fill,g_faces/e_sepia
```

D)

```
e_sepia:100/g_faces
```

**Difficulty:** Medium

**11. In the following code snippet, what is the primary performance issue and how would you fix it?**

```javascript
// Image gallery implementation
const images = ["image1", "image2", "image3", "image4", "image5"];

images.forEach((image) => {
  const url = cloudinary.url(image, {
    transformation: [
      { width: 400, height: 300, crop: "fill" },
      { effect: "art:frost" },
      { border: "2px_solid_black" },
      { dpr: 2.0 },
    ],
  });

  // Append image to gallery
  gallery.innerHTML += `<img src="${url}" alt="${image}">`;
});
```

A) The transformations are too complex - simplify by removing effects
B) Named transformations should be used instead of inline transformations
C) DPR should be set to auto instead of a fixed value
D) The gallery.innerHTML approach causes performance issues, not the transformations

**Difficulty:** Hard

**12. Which transformation parameters allow you to dynamically resize a video based on the viewer's device? (Select all that apply)**

A) w_auto
B) h_auto
C) dpr_auto
D) c_fill
E) c_scale

**Difficulty:** Medium

**13. Which code correctly implements a conditional transformation that applies a watermark only to high-resolution images (width > 1000px)?**

A)

```javascript
cloudinary.url("sample.jpg", {
  transformation: [
    { if: "w_gt_1000", overlay: "watermark", width: 200, gravity: "southeast" },
    { if: "else" },
    { if: "end" },
  ],
});
```

B)

```javascript
cloudinary.url("sample.jpg", {
  transformation: [
    {
      if: "w > 1000",
      then: { overlay: "watermark", width: 200, gravity: "southeast" },
    },
  ],
});
```

C)

```javascript
cloudinary.url("sample.jpg", {
  condition: { width: { gt: 1000 } },
  transformation: [{ overlay: "watermark", width: 200, gravity: "southeast" }],
});
```

D)

```javascript
cloudinary.url("sample.jpg", {
  transformation: [
    { if: "w_gt_1000" },
    { overlay: "watermark", width: 200, gravity: "southeast" },
    { if: "end" },
  ],
});
```

**Difficulty:** Hard

**14. Which of these methods can be used to prevent unwanted transformations of your assets? (Select all that apply)**

A) Using signed URLs with transformation restriction
B) Configuring allowed transformations in the account settings
C) Setting up a notification webhook to monitor transformation usage
D) Using the strict_transformations flag
E) Implementing URL validation in your application code

**Difficulty:** Medium

**15. You need to extract a 10-second clip from a video starting at the 30-second mark. Which transformation parameters would you use?**

A) start_offset=30,end_offset=40
B) start_time=30,end_time=40
C) duration=10,offset=30
D) trim=30:10

**Difficulty:** Easy

## Answers

1. C - c_fit.

**Explanation:** The `c_fit` crop mode resizes the image to fit within the specified dimensions while maintaining the original aspect ratio. Unlike `c_scale` which forces the exact dimensions, `c_fit` ensures the entire image is visible without distortion by fitting it within the specified width and height boundaries.

2. A - Transformations are applied from left to right in the URL.

**Explanation:** Cloudinary processes transformation chains in sequential order from left to right. Each transformation's output becomes the input for the next transformation in the chain. This allows for complex multi-step manipulations where the order of operations is critical to achieving the desired result.

3. A -

```
c_crop,w_500,h_500,g_center/c_scale,w_300,h_300
```

**Explanation:** This transformation chain works in two sequential steps: first, it extracts a 500x500 square region from the center of the original image (`c_crop,w_500,h_500,g_center`), then it resizes that cropped square to 300x300 pixels (`c_scale,w_300,h_300`). The order is important because we're first cropping, then scaling the result.

4. A - q_auto.
   B - f_auto.

**Explanation:** These two parameters work together to optimize delivery: `q_auto` automatically determines the optimal quality level based on image content and viewer's device, while `f_auto` automatically selects the most efficient format supported by the user's browser (WebP for Chrome, AVIF for supported browsers, JPEG/PNG for others). Together they significantly reduce file size while maintaining visual quality.

5. A -

```
t_profile_thumbnail/bo_3px_solid_rgb:D5D5D5
```

**Explanation:** This is the correct syntax for applying a named transformation followed by additional transformations. Named transformations use the `t_` prefix followed by the transformation name. The transformations are applied in sequence, so the border is added after the named transformation is applied.

6. A -

```javascript
cloudinary.url("sample.jpg", {
  transformation: [
    { effect: "sepia" },
    { radius: 20 },
    { border: "5px_solid_rgb:FF0000" },
  ],
});
```

**Explanation:** This code correctly uses the transformation array with separate objects for each transformation step. The transformations are applied in sequence: first the sepia effect, then rounding the corners (radius), and finally adding the red border. Separating each transformation into its own object in the array ensures they're applied in the correct order.

7. B -

```
w_500,c_scale,dpr_auto,q_auto
```

**Explanation:** This combination sets a base width of 500 pixels while using `dpr_auto` to automatically deliver higher resolution versions to high-DPR devices like Retina displays. The `q_auto` parameter ensures optimal quality-to-filesize ratio for each device. Using a specific width rather than `w_auto` provides better cache efficiency while still supporting responsive delivery.

8. A - `text`.

**Explanation:** When adding text overlays, only the `text` parameter is absolutely required as it specifies the content to display. While other parameters like color, font, size, and positioning improve the appearance and placement, they have default values if not specified. The text parameter can be provided either directly or as a reference to a text style using the `text` parameter.

9. C - Use the srcset attribute with multiple Cloudinary URLs.

**Explanation:** Using the HTML `srcset` attribute with multiple Cloudinary URLs at different widths allows the browser to select the optimal version based on the device's characteristics. This approach provides precise control over which image dimensions are delivered to different device sizes without requiring JavaScript or compromising on performance.

10. A -

```
c_crop,g_faces/e_sepia
```

**Explanation:** This transformation chain first crops the image to focus on detected faces (`c_crop,g_faces`) and then applies a sepia effect (`e_sepia`) to the cropped result. The order ensures that face detection is performed on the original image for best accuracy, and the effect is applied only to the relevant portion containing faces.

11. B - Named transformations should be used instead of inline transformations.

**Explanation:** The performance issue is that the same transformation chain is being repeated for each image in the gallery. Using a named transformation would allow the complex transformation to be defined once on the Cloudinary account and then simply referenced by name in each URL. This reduces URL length, improves cacheability, and makes the transformations easier to maintain.

12. A - w_auto.
    C - dpr_auto.
    E - c_scale.

**Explanation:** These parameters work together to enable responsive video delivery. `w_auto` allows the video width to adjust based on container size, `dpr_auto` delivers appropriate resolution for the viewer's device pixel ratio, and `c_scale` is the transformation type that handles proportional resizing. Together they ensure optimal video size for each viewer's device.

13. D -

```javascript
cloudinary.url("sample.jpg", {
  transformation: [
    { if: "w_gt_1000" },
    { overlay: "watermark", width: 200, gravity: "southeast" },
    { if: "end" },
  ],
});
```

**Explanation:** This code correctly implements a conditional transformation using Cloudinary's if/end syntax. It checks if the image width is greater than 1000 pixels (`if: "w_gt_1000"`) and, if true, applies the watermark overlay to the southeast corner. The condition is properly closed with `if: "end"`. This approach applies transformations only when needed, saving bandwidth.

14. A - Using signed URLs with transformation restriction.
    B - Configuring allowed transformations in the account settings.
    D - Using the strict_transformations flag.

**Explanation:** These three methods prevent unwanted transformations: Signed URLs with transformation restrictions cryptographically ensure only approved transformations can be applied. Account settings can be configured to whitelist specific transformations. The strict_transformations flag restricts transformations to predefined, named transformations only. Together they provide layered security against transformation abuse.

15. A - start_offset=30,end_offset=40.

**Explanation:** To extract a specific portion of a video, `start_offset` specifies the starting point (30 seconds into the video) and `end_offset` defines the ending point (40 seconds into the video), resulting in a 10-second clip. These parameters allow precise trimming of video content without re-encoding the entire file.
