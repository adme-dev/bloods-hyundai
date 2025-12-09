# SellMyCar Component - Technical Documentation

## Overview

The SellMyCar feature allows users to submit their vehicle information along with photos for valuation. This document details the component architecture, data flow, form structure, and image upload mechanism.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     SellMyCar.vue                           │
│  (Main View Component)                                      │
│  - Loads page content                                       │
│  - Manages form submission                                  │
│  - Handles API communication                                │
└────────────────┬────────────────────────────────────────────┘
                 │
                 │ imports formSchema
                 │
┌────────────────▼────────────────────────────────────────────┐
│              sellMyCar.js                                   │
│  (Form Configuration)                                       │
│  - Defines form structure                                   │
│  - 4 sections: Personal, Vehicle Details,                   │
│    Vehicle Photos, Additional Info                          │
└────────────────┬────────────────────────────────────────────┘
                 │
                 │ passed to
                 │
┌────────────────▼────────────────────────────────────────────┐
│                DaForm.vue                                   │
│  (Form Renderer)                                            │
│  - Dynamically renders form fields                          │
│  - Validates all fields                                     │
│  - Emits form data on submit                                │
└────────────────┬────────────────────────────────────────────┘
                 │
                 │ renders components including
                 │
┌────────────────▼────────────────────────────────────────────┐
│           DaImageUpload.vue                                 │
│  (Image Upload Component)                                   │
│  - Handles file selection                                   │
│  - Encodes images to Base64                                 │
│  - Provides preview and validation                          │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Breakdown

### 1. SellMyCar.vue (Main View)

**Location:** `src/views/SellMyCar.vue`

**Purpose:** Main container component that orchestrates the entire sell-my-car flow.

#### Key Features:
- Loads page content from WordPress CMS
- Renders dynamic form using DaForm component
- Handles form submission to API
- Displays success/error modals
- Clears form after successful submission

#### Data Properties:
```javascript
{
  page: null,              // WordPress page content
  formControls: formSchema // Form configuration from sellMyCar.js
}
```

#### Methods:

##### `getPage()`
Fetches page content from WordPress API using the PageService.

```javascript
getPage() {
  PageService.getPageBySlug(
    this.$store.state.site.pages["sell-my-car"]
  ).then((data) => {
    this.page = data;
  });
}
```

##### `onChange(formData)`
Handles form submission when user clicks "Send Enquiry".

**Process:**
1. Receives formData object from DaForm component
2. Flattens nested "choice" fields into top-level properties
3. Posts data to API endpoint
4. Shows success/error modal
5. Clears form on success

**API Endpoint:**
```
POST ${process.env.VUE_APP_PUBLIC_API_URL}/newform
```

**Payload Structure:**
```javascript
{
  payload: formData,  // All form fields including Base64 encoded images
  formId: 9          // Gravity Forms form ID
}
```

---

### 2. sellMyCar.js (Form Configuration)

**Location:** `src/config/forms/sellMyCar.js`

**Purpose:** Defines the complete form structure with 4 main sections.

#### Form Sections:

##### Section 1: Personal Details (`personal`)
- First Name (input_2) - Required
- Last Name (input_3) - Required
- Email (input_4) - Required
- Phone (input_5) - Required

##### Section 2: Vehicle Details (`vechicleDetails`)
- Year (input_6) - Required
- Vehicle Make (input_7) - Required
- Vehicle Model (input_8) - Required
- Vehicle Grade (input_9) - Required
- VIN Number (input_10) - Optional
- Vehicle Registration (input_11) - Required
- Odometer (input_12) - Required
- Vehicle Condition (input_16) - Required (Excellent/Average/Poor)
- Tyre Condition (input_17) - Required (Excellent/Average/Poor)
- Full Service History (input_18) - Required (Yes/No)
- One Owner (input_19) - Required (Yes/No)

##### Section 3: Vehicle Photos (`vehiclePhotos`)

**Description Text:**
> "Please upload at least one image to assist with your valuation. The more images uploaded the greater the likelihood that a more accurate valuation will be able to be provided in the best possible timeframe. If possible please include a photo of the odometer whilst the engine has been switched to the on position. Total images limited to a maximum of 6 thank you."

**Image Upload Fields:**
- input_35 - **Required** (First photo)
- input_36 - Optional (Second photo)
- input_37 - Optional (Third photo)
- input_38 - Optional (Fourth photo)
- input_39 - Optional (Fifth photo)
- input_40 - Optional (Sixth photo)

Each image field uses the `DaImageUpload` component.

##### Section 4: Additional Information (`vehicleAdditionalInfo`)
- Previous Hail Damage (choice_input_26) - Switch + conditional textarea
- Finance Owing (choice_input_29) - Switch + conditional textarea
- Known Faults (choice_input_31) - Switch + conditional textarea
- Additional Accessories (input_33) - Optional textarea
- Additional Comments (input_34) - Optional textarea

---

### 3. DaForm.vue (Form Renderer)

**Location:** `src/components/form-elements/DaForm.vue`

**Purpose:** Generic form component that dynamically renders any form based on configuration.

#### Key Features:
- Dynamic component rendering based on formControls prop
- Field validation on submit
- Two-way data binding with v-model
- Form clearing capability
- Loading state management

#### Data Structure:
```javascript
{
  fieldModels: {},    // Object containing all field values
  isFormValid: true   // Overall form validation state
}
```

#### Methods:

##### `submitForm()`
**Process:**
1. Sets loading state to true
2. Collects all fields from all fieldsets
3. Validates all required fields
4. Calculates overall form validity
5. Emits 'input' event with fieldModels if valid
6. Shows error dialog if invalid

**Validation Logic:**
```javascript
// Only validates required fields
if (field[0].options.required) {
  validatedFileds[key] = this.$refs[key][0].validate();
}

// Form is valid if all required fields pass validation
this.isFormValid = 
  Object.values(validatedFileds).reduce((m, o) => m + o) === 
  Object.keys(validatedFileds).length;
```

##### `clearAll()`
Resets all form fields to empty state. Special handling for:
- DaSelect components
- DaImageUpload components
- DaChoice components

##### `vModels()`
Initializes the fieldModels object by iterating through formControls and creating empty string values for each field.

---

### 4. DaImageUpload.vue (Image Upload Component)

**Location:** `src/components/form-elements/DaImageUpload.vue`

**Purpose:** Handles individual image file uploads with preview and Base64 encoding.

#### Key Features:
- Drag-and-drop file input
- Image preview with UIkit background cover
- Base64 encoding for API submission
- Validation for required fields
- Delete/reset capability

#### Data Properties:
```javascript
{
  isValid: true,                    // Validation state
  preview: false,                   // Show/hide preview
  imageUrl: "",                     // Blob URL for preview
  isRequired: this.options.required // Required field flag
}
```

#### Methods:

##### `filesChange(fieldName, files)`
**Process:**
1. Extracts the first file from the files array
2. Sets preview mode to true
3. Creates a blob URL for preview display
4. Encodes the image to Base64
5. Emits the Base64 string via 'input' event

```javascript
async filesChange(fieldName, files) {
  const [image] = files;
  this.preview = true;
  this.isValid = true;
  this.imageUrl = URL.createObjectURL(image);
  
  const endcodedImage = await this.encodeImage(image);
  
  this.$emit("input", endcodedImage);
}
```

##### `encodeImage(image)`
Converts image file to Base64 data URL using FileReader API.

**Returns:** Promise that resolves to Base64 string

```javascript
encodeImage(image) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(image);
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
  });
}
```

**Base64 Format:**
```
data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...
```

##### `validate()`
Checks if image is uploaded when field is required.

```javascript
validate() {
  return !this.imageUrl && this.isRequired ? 
    (this.isValid = false) : 
    (this.isValid = true);
}
```

##### `resetImageField()`
Clears the file input and resets preview state.

##### `clear()`
Public method called by parent to reset the component.

#### UI/UX Features:
- 290px height dropbox area
- Gray background (#eee) that turns white on hover
- Red border when validation fails
- Trash icon button to delete uploaded image
- Image preview uses UIkit's background-cover for proper scaling

---

## Data Flow: Image Upload

### Step-by-Step Process

```
1. User Selection
   │
   ├─> User clicks/drags image to DaImageUpload dropbox
   │
   └─> Browser file input triggers @change event
       │
       └─> filesChange(fieldName, files) called

2. Image Processing
   │
   ├─> Extract first file from FileList
   │
   ├─> Create blob URL: URL.createObjectURL(image)
   │   └─> Used for preview display only
   │
   └─> Encode to Base64: encodeImage(image)
       │
       └─> FileReader.readAsDataURL(image)
           │
           └─> Returns: "data:image/jpeg;base64,..."

3. State Update
   │
   ├─> preview = true (show image preview)
   │
   ├─> imageUrl = blob URL (for preview)
   │
   └─> Emit Base64 string to parent
       │
       └─> this.$emit("input", encodedImage)

4. Form Collection
   │
   └─> DaForm.vue receives Base64 via v-model
       │
       └─> Stored in fieldModels[input_35...input_40]

5. Form Submission
   │
   └─> User clicks "Send Enquiry"
       │
       └─> DaForm validates and emits fieldModels
           │
           └─> SellMyCar.vue receives formData

6. API Submission
   │
   └─> POST to /newform endpoint
       │
       └─> Payload includes Base64 images
           │
           ├─> input_35: "data:image/jpeg;base64,..."
           ├─> input_36: "data:image/png;base64,..."
           └─> ... (up to input_40)

7. Backend Processing
   │
   └─> Gravity Forms (formId: 9) receives data
       │
       └─> Base64 images are decoded and stored
```

---

## API Integration

### Endpoint Details

**URL:** `${process.env.VUE_APP_PUBLIC_API_URL}/newform`

**Method:** POST

**Headers:** 
- Content-Type: application/json (implicit via axios)

**Request Body:**
```json
{
  "payload": {
    "input_2": "John",
    "input_3": "Doe",
    "input_4": "john@example.com",
    "input_5": "0412345678",
    "input_6": "2020",
    "input_7": "Hyundai",
    "input_8": "i30",
    "input_9": "N Line",
    "input_10": "KMHD123456789",
    "input_11": "ABC123",
    "input_12": "45000",
    "input_16": "excellent",
    "input_17": "average",
    "input_18": "yes",
    "input_19": "yes",
    "input_35": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
    "input_36": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
    "input_26": "No",
    "input_29": "No",
    "input_31": "No",
    "input_33": "Roof racks, tow bar",
    "input_34": "Car is in excellent condition"
  },
  "formId": 9
}
```

**Success Response:**
```json
{
  "is_valid": true,
  "confirmation_message": "Thank you for your submission!"
}
```

**Error Response:**
The component shows a generic error modal without parsing specific error details.

### Environment Variables

**Required:**
- `VUE_APP_PUBLIC_API_URL` - Base URL for the API endpoint

**Example:**
```
VUE_APP_PUBLIC_API_URL=https://api.example.com
```

---

## Image Upload Specifications

### File Constraints

**Accepted Formats:**
- All image formats (accept="image/*")
- Common: JPEG, PNG, GIF, WebP, SVG

**Number of Images:**
- Minimum: 1 (input_35 is required)
- Maximum: 6 (input_35 through input_40)

**File Size:**
- No explicit client-side limit
- Limited by Base64 encoding and API payload size
- Recommended: Keep individual images under 5MB

### Base64 Encoding Details

**Format:**
```
data:[MIME-TYPE];base64,[BASE64-ENCODED-DATA]
```

**Examples:**
- JPEG: `data:image/jpeg;base64,/9j/4AAQSkZJRg...`
- PNG: `data:image/png;base64,iVBORw0KGgoAAAANSUh...`

**Size Impact:**
- Base64 encoding increases size by ~33%
- 1MB image → ~1.33MB Base64 string
- 6 images at 2MB each → ~16MB payload

### Preview Implementation

**Technology:** UIkit's `uk-img` directive

**Features:**
- Lazy loading
- Background cover positioning
- Responsive sizing

**HTML Structure:**
```html
<div 
  class="image-preview uk-background-cover uk-light uk-flex uk-flex-bottom uk-flex-center"
  :data-src="imageUrl"
  uk-img
>
  <span class="uk-icon-button" uk-icon="trash" @click="resetImageField"></span>
</div>
```

---

## Validation Rules

### Image Upload Validation

**Required Field (input_35):**
- Must have an image uploaded before form submission
- Shows red border if validation fails
- Validation triggered on form submit

**Optional Fields (input_36-40):**
- No validation required
- Can be left empty

**Validation Logic:**
```javascript
validate() {
  return !this.imageUrl && this.isRequired ? 
    (this.isValid = false) : 
    (this.isValid = true);
}
```

**Visual Indicators:**
- Valid: Gray border (#eee)
- Invalid: Red border (#ed0000) + red text

### Form-Level Validation

**Process:**
1. All required fields validated individually
2. Results collected in `validatedFileds` object
3. Form valid if: sum of valid fields = number of required fields

```javascript
this.isFormValid = 
  Object.values(validatedFileds).reduce((m, o) => m + o) === 
  Object.keys(validatedFileds).length;
```

---

## User Experience Flow

### Happy Path

1. **Page Load**
   - User navigates to /sell-my-car
   - Page content loads from WordPress
   - Form renders with 4 sections

2. **Form Completion**
   - User fills personal details
   - User enters vehicle information
   - User uploads at least 1 photo (required)
   - User optionally uploads up to 5 more photos
   - User provides additional information

3. **Image Upload**
   - User clicks/drags image to dropbox
   - Image preview appears immediately
   - User can delete and re-upload if needed

4. **Submission**
   - User clicks "Send Enquiry"
   - Loading state activates
   - Form validates all required fields
   - Data posts to API

5. **Success**
   - Success modal appears
   - Form clears automatically
   - User can submit another request

### Error Scenarios

**Validation Errors:**
- Missing required fields highlighted
- Error dialog appears
- User corrects and resubmits

**API Errors:**
- Generic error modal shown
- Form data preserved
- User can retry submission

**Image Upload Errors:**
- File reading errors caught by Promise rejection
- Component handles gracefully (though error display could be improved)

---

## Technical Considerations

### Performance

**Image Encoding:**
- Synchronous FileReader operation
- Can block UI for large images
- Consider adding loading indicator for large files

**Payload Size:**
- 6 high-resolution images can create very large payloads
- May hit API gateway limits
- Consider implementing:
  - Client-side image compression
  - Resolution limits
  - File size warnings

**Memory Management:**
- Blob URLs created with `URL.createObjectURL()`
- Should be revoked with `URL.revokeObjectURL()` when component unmounts
- Current implementation may have minor memory leak

### Security

**Base64 Encoding:**
- Not encryption, just encoding
- Images transmitted in plain text (albeit encoded)
- Ensure HTTPS for API communication

**File Type Validation:**
- Only client-side validation (accept="image/*")
- Backend should validate file types
- Backend should scan for malicious content

**File Size:**
- No client-side size limits
- Backend must enforce limits
- Consider DoS attack vectors

### Browser Compatibility

**FileReader API:**
- Supported in all modern browsers
- IE10+ support

**Blob URLs:**
- Widely supported
- IE10+ support

**UIkit:**
- Requires UIkit CSS/JS library
- Version dependency should be documented

---

## Recommendations for Improvement

### 1. Image Compression
Add client-side image compression before Base64 encoding:

```javascript
async compressImage(file, maxWidth = 1920, quality = 0.8) {
  // Create canvas and compress
  // Return compressed blob
}
```

### 2. Progress Indicators
Show upload/encoding progress for large images:

```javascript
data() {
  return {
    uploadProgress: 0,
    isProcessing: false
  }
}
```

### 3. File Size Validation
Add file size checking before encoding:

```javascript
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
if (image.size > MAX_FILE_SIZE) {
  this.showError('File too large. Maximum 5MB.');
  return;
}
```

### 4. Better Error Handling
Provide specific error messages:

```javascript
.catch((error) => {
  const errorMessage = error.response?.data?.message || 
    'Something went wrong. Please try again.';
  this.UIkit.modal.alert(`
    <div class="uk-alert-danger" uk-alert>
      <p>${errorMessage}</p>
    </div>
  `);
});
```

### 5. Memory Cleanup
Revoke blob URLs when component unmounts:

```javascript
beforeDestroy() {
  if (this.imageUrl) {
    URL.revokeObjectURL(this.imageUrl);
  }
}
```

### 6. Image Format Optimization
Convert all images to JPEG with quality setting:

```javascript
canvas.toBlob((blob) => {
  // Use blob instead of original file
}, 'image/jpeg', 0.85);
```

### 7. Drag and Drop Enhancement
Add visual feedback for drag operations:

```javascript
@dragover.prevent="isDragging = true"
@dragleave.prevent="isDragging = false"
@drop.prevent="onDrop"
```

---

## Testing Checklist

### Functional Tests
- [ ] Upload single image (required field)
- [ ] Upload multiple images (up to 6)
- [ ] Delete uploaded image
- [ ] Submit form with images
- [ ] Validation for required image field
- [ ] Form clears after successful submission

### Image Format Tests
- [ ] JPEG images
- [ ] PNG images
- [ ] GIF images
- [ ] WebP images
- [ ] SVG images (if supported by backend)

### Edge Cases
- [ ] Very large images (>10MB)
- [ ] Very small images (<10KB)
- [ ] Corrupt image files
- [ ] Non-image files (should be blocked by accept attribute)
- [ ] Rapid successive uploads
- [ ] Upload while form is submitting

### Browser Tests
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

### API Tests
- [ ] Successful submission
- [ ] Network timeout
- [ ] API error response
- [ ] Invalid payload
- [ ] Large payload (6 high-res images)

---

## Troubleshooting

### Images Not Uploading

**Symptom:** Images selected but not appearing in preview

**Possible Causes:**
1. FileReader error
2. Browser compatibility issue
3. File too large causing memory issue

**Debug Steps:**
```javascript
// Add console logging in filesChange
console.log('File selected:', image);
console.log('File size:', image.size);
console.log('File type:', image.type);
```

### Form Submission Fails

**Symptom:** Form validates but API call fails

**Possible Causes:**
1. Payload too large
2. API endpoint unavailable
3. CORS issues
4. Invalid Base64 encoding

**Debug Steps:**
```javascript
// Log payload size
const payloadSize = JSON.stringify(formData).length;
console.log('Payload size:', payloadSize, 'bytes');
```

### Validation Not Working

**Symptom:** Form submits without required image

**Possible Causes:**
1. Validation method not called
2. isRequired flag not set correctly
3. Parent form not checking validation results

**Debug Steps:**
```javascript
// Add logging in validate method
validate() {
  console.log('Validating:', this.options.name);
  console.log('Has image:', !!this.imageUrl);
  console.log('Is required:', this.isRequired);
  // ... rest of validation
}
```

---

## Related Files

### Core Components
- `/src/views/SellMyCar.vue` - Main view component
- `/src/config/forms/sellMyCar.js` - Form configuration
- `/src/components/form-elements/DaForm.vue` - Form renderer
- `/src/components/form-elements/DaImageUpload.vue` - Image upload component

### Supporting Components
- `/src/components/form-elements/DaInput.vue` - Text input
- `/src/components/form-elements/DaEmail.vue` - Email input
- `/src/components/form-elements/DaPhone.vue` - Phone input
- `/src/components/form-elements/DaSelect.vue` - Dropdown select
- `/src/components/form-elements/DaTextArea.vue` - Text area
- `/src/components/form-elements/DaChoice.vue` - Switch with conditional field
- `/src/components/form-elements/DaSwitch.vue` - Toggle switch

### Services
- `/src/services/page.js` - Page content service

### Mixins
- `/src/mixins/meta.js` - Meta tags mixin

---

## Glossary

**Base64 Encoding:** Binary-to-text encoding scheme that represents binary data in ASCII string format.

**Blob URL:** Temporary URL that references data stored in browser memory.

**DaForm:** Custom dynamic form component that renders forms based on configuration objects.

**FileReader API:** Web API that lets web applications read file contents asynchronously.

**Gravity Forms:** WordPress plugin for form management (backend integration).

**UIkit:** Front-end framework used for UI components and styling.

**v-model:** Vue.js directive for two-way data binding.

---

## Change Log

| Date | Version | Changes |
|------|---------|---------|
| 2024-12-08 | 1.0 | Initial documentation created |

---

## Support

For questions or issues related to this feature:

1. Check this documentation first
2. Review the source code in the related files
3. Test in browser developer console
4. Check API endpoint documentation
5. Contact development team

---

*This documentation was generated based on the current implementation as of December 8, 2024.*

