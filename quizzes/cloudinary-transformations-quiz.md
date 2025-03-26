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

1. C - c_fit adjusts an image to fit within specific dimensions while maintaining aspect ratio.
2. A - Transformations are applied from left to right in the URL.
3. A - This first crops a square from the center, then scales it to 300x300.
4. A, B - q_auto and f_auto optimize quality and format automatically.
5. A - Named transformations use t\_ prefix followed by the transformation name.
6. A - This correctly uses the transformation array with separate objects for each step.
7. B - This sets a base width while allowing DPR and quality to adjust automatically.
8. A, B - Layer (l*) and color (co*) are required for text overlays.
9. C - Using srcset with multiple Cloudinary URLs is most efficient for responsive images.
10. A - This crops focusing on faces first, then applies the sepia effect.
11. B - Named transformations should be used instead of repeating the same inline transformations.
12. A, C, E - w_auto, dpr_auto and c_scale allow dynamic video resizing.
13. D - This correctly implements the if condition for width and applies the watermark conditionally.
14. A, B, D - Signed URLs with restrictions, allowed transformations configuration, and strict_transformations all help prevent unwanted transformations.
15. A - start_offset and end_offset are used to extract portions of a video.
