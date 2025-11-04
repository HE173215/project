# Test File Upload and Download Flow

## Step-by-Step Testing Guide

### Prerequisites
- ✅ Server running: `npm run server` (port 5000)
- ✅ Client built: `npm run build`
- ✅ Cloudinary credentials configured in `.env`
- ✅ MongoDB connected

---

## Part 1: Teacher Upload Assignment Files

### Step 1: Login as Teacher
1. Go to http://localhost:3000
2. Login with teacher account
3. Navigate to Assessment Management page

### Step 2: Create Assessment for Class
1. Click "Tạo bài tập cho lớp" (Create assessment for class)
2. Fill form:
   - **Tên bài tập:** "Bài Tập Lập Trình"
   - **Lớp:** Select a class
   - **Loại:** "Assignment"
   - **Trọng số:** 20
   - **Deadline:** Select a future date
3. **Upload files:**
   - Click "Chọn file (PDF, Word, Zip, v.v.)"
   - Select 1-2 files to upload (PDF, DOCX, etc.)
4. Click "Giao bài tập"

### Expected Results for Step 2:
```
✅ See message: "Giao bài tập thành công cho X học viên"
✅ Files uploaded to Cloudinary (check console)
✅ Assessment created in MongoDB with attachments
✅ Students receive notification
```

### Server Logs to Check:
```
POST /api/files/upload → 200 OK
Response: {
  success: true,
  data: {
    files: [
      {
        originalName: "...",
        url: "https://res.cloudinary.com/...",
        cloudinaryId: "assessments/...",
        size: 12345,
        ...
      }
    ]
  }
}

POST /api/assessments/create-for-class → 201 Created
Response: {
  success: true,
  message: "Giao bài tập thành công cho 5 học viên",
  data: {
    count: 5,
    assessments: [...]
  }
}
```

### Database Check:
Go to MongoDB and check Assessment collection:
```javascript
{
  title: "Bài Tập Lập Trình",
  type: "Assignment",
  status: "Pending",
  attachments: [
    {
      originalName: "assignment_guide.pdf",
      url: "https://res.cloudinary.com/derr67kfl/...",
      cloudinaryId: "assessments/1699564800000_assignment_guide",
      size: 512000,
      mimeType: "application/pdf",
      uploadedAt: "2024-11-04T07:30:00.000Z"
    }
  ]
}
```

### Cloudinary Check:
Go to https://cloudinary.com/console/media_library
- ✅ Check `/assessments` folder
- ✅ Files should appear with normalized names
- ✅ Files should be accessible via URL

---

## Part 2: Student View and Download Assignment Files

### Step 1: Login as Student
1. Logout from teacher account
2. Go to http://localhost:3000
3. Login with student account

### Step 2: View Assessment
1. Navigate to Assessment page
2. Find the assessment just created
3. Click "Xem chi tiết" (View details)

### Expected Results for Step 2:
```
Modal should show:
✅ Bài tập: "Bài Tập Lập Trình"
✅ Lớp: [Class name]
✅ Deadline: [Your date]
✅ Trọng số: 20%

---- File Bài Tập từ Giáo Viên ----
✅ assignment_guide.pdf          512 KB
                            [Tải] button
✅ [Other files if uploaded]

---- Tải lên file ----
[Choose file] button for student to submit
```

### Step 3: Download Teacher's File
1. In the modal, click "Tải" button next to teacher's file
2. Wait for download to complete

### Expected Results for Step 3:
```
✅ Browser downloads file to Downloads folder
✅ File name matches original: "assignment_guide.pdf"
✅ File size matches: ~512 KB
✅ File can be opened (PDF, DOCX, etc.)
```

### Browser DevTools Check:
Open Developer Tools (F12) → Network tab
```
Request: GET https://res.cloudinary.com/derr67kfl/image/upload/...
Response: 200 OK
Content-Type: application/pdf
Content-Length: 512000
```

---

## Part 3: Student Submit Assignment with Files

### Step 1: Submit Assessment
1. Still in the assessment modal
2. Click "Chọn file (PDF, Word, Zip, v.v.)" button
3. Select 1-2 files to submit (your solution)
4. Click "Nộp Bài" button

### Expected Results for Step 1:
```
Console logs: "Uploading: 100%"
✅ See message: "Nộp bài tập thành công"
✅ Modal closes
✅ Assessment status changed to "Submitted"
✅ Notification sent to teacher
```

### Server Logs to Check:
```
POST /api/files/upload → 200 OK
Response with student's files uploaded to Cloudinary

PATCH /api/assessments/:id/submit → 200 OK
Response: {
  success: true,
  message: "Nộp bài tập thành công",
  data: {
    status: "Submitted",
    attachments: [
      {
        originalName: "solution.pdf",
        url: "https://res.cloudinary.com/...",
        ...
      }
    ],
    submissionDate: "2024-11-04T07:35:00.000Z"
  }
}
```

### Database Check:
Assessment document should now have:
```javascript
{
  status: "Submitted",  // Changed from "Pending"
  submissionDate: ISODate("2024-11-04T07:35:00.000Z"),
  attachments: [
    {
      originalName: "solution.pdf",
      url: "https://res.cloudinary.com/...",
      size: 256000,
      ...
    }
  ]
}
```

---

## Part 4: Student View Submitted Files

### Step 1: View Submitted Assessment
1. Go back to Assessment page
2. Find the assessment in "Submitted" tab
3. Click "Xem chi tiết"

### Expected Results for Step 1:
Modal should show:
```
Bài tập: "Bài Tập Lập Trình"
Trạng thái: ✅ Submitted
Trọng số: 20%

---- File Bài Tập từ Giáo Viên ----
✅ assignment_guide.pdf          512 KB
                            [Tải]

---- File Nộp ----
✅ solution.pdf                  256 KB
                            [Tải]
```

### Step 2: Download Student's Submitted File
1. Click "Tải" button next to student's submitted file

### Expected Results for Step 2:
```
✅ Browser downloads "solution.pdf"
✅ File opens correctly
```

---

## Part 5: Teacher Grade Assessment

### Step 1: Login as Teacher
1. Logout from student account
2. Login with teacher account

### Step 2: View Ungraded Assessments
1. Go to Assessment Management
2. Click "Danh sách bài chưa chấm" tab
3. Find the submitted assessment

### Expected Results for Step 2:
```
✅ Assessment appears in list
✅ Status shows "Submitted"
✅ Student's files visible
```

### Step 3: View Student's Submission
1. Click on the assessment row or "Xem" button

### Expected Results for Step 3:
Modal shows:
```
Học viên: [Student name]
Bài tập: "Bài Tập Lập Trình"

---- File Nộp ----
✅ solution.pdf                  256 KB
                            [Tải]

Nhập điểm: [Text field]
Nhận xét: [Text area]

[Chấm điểm] button
```

### Step 4: Grade Assessment
1. Enter score: 85
2. Enter feedback: "Good job!"
3. Click "Chấm điểm"

### Expected Results for Step 4:
```
✅ See message: "Chấm điểm thành công"
✅ Assessment moved to "Graded" tab
✅ Student receives notification
```

---

## Troubleshooting

### Files Not Uploading
**Check:**
1. Cloudinary credentials in `.env` correct?
   ```bash
   echo $CLOUDINARY_CLOUD_NAME
   ```
2. Server logs for upload errors
   ```bash
   npm run server 2>&1 | grep -i "error\|upload"
   ```
3. Browser Network tab for failed requests
4. File size < 10MB?
5. File type in allowed list? (PDF, DOCX, XLSX, etc.)

### Files Not Downloading
**Check:**
1. URL in database is correct?
   ```javascript
   db.assessments.findOne({}).attachments[0].url
   ```
2. Open URL directly in browser - should download file
3. Check Cloudinary dashboard - file exists?
4. CORS settings in Cloudinary

### Teacher's Files Not Showing in Student Modal
**Check:**
1. Assessment has attachments in database?
   ```javascript
   db.assessments.findOne({title: "Bài Tập..."}).attachments.length > 0
   ```
2. Refresh browser page (F5)
3. Check browser console for JavaScript errors
4. Files uploaded before or after assessment creation?

### Assessment Status Not Changing
**Check:**
1. Server response status is 200?
2. Assessment ID correct?
3. User has permission to submit?
4. Check MongoDB for the document update

---

## Checklist - All Tests Passed?

- [ ] Teacher can upload files when creating assessment
- [ ] Files appear in Cloudinary dashboard
- [ ] Student sees files in submit modal
- [ ] Student can download teacher's files
- [ ] Student can upload and submit files
- [ ] Student's submitted files show in detail drawer
- [ ] Teacher can grade assessment
- [ ] Both old format (string) and new format (object) work
- [ ] File names display correctly
- [ ] File sizes display correctly
- [ ] Download works for both teacher and student files
- [ ] Notifications sent properly
- [ ] Database stores all metadata correctly

---

## Quick Debug Commands

### Check if Cloudinary is working:
```bash
# Test upload endpoint with curl
curl -X POST http://localhost:5000/api/files/upload \
  -F "files=@/path/to/test.pdf" \
  -H "Authorization: Bearer TOKEN"
```

### Check MongoDB data:
```bash
# Show assessments with files
db.assessments.find({attachments: {$ne: []}}).pretty()

# Show file details
db.assessments.findOne({}).attachments
```

### Check Cloudinary:
Visit: https://cloudinary.com/console/media_library
Look for folder: `/assessments`

### Check server logs:
```bash
# Kill and restart
npm run server

# Or tail logs
tail -f server.log
```

---

## Success Criteria

All tests pass when:
1. ✅ Teacher can upload files with assignment
2. ✅ Files stored in Cloudinary
3. ✅ Metadata stored in MongoDB
4. ✅ Student can see and download teacher's files
5. ✅ Student can upload and submit files
6. ✅ Files properly downloaded from Cloudinary
7. ✅ No errors in console or server logs
8. ✅ All file metadata correct (name, size, type, etc.)
