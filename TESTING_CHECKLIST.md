# Implementation Checklist & Testing Guide

## ✅ Completed Implementation Tasks

### Database
- [x] Created `user_experiences` table with job_title, company_name, dates, description
- [x] Created `user_status` table for online/offline tracking
- [x] Created `message_read_receipts` table for read receipts
- [x] Added indexes for query performance
- [x] Added `bio` field to users table (already existed)
- [x] All migrations in `init-db.sql`

### Backend Routes
- [x] `/api/experiences/user/:userId` - GET all experiences
- [x] `/api/experiences` - POST create experience
- [x] `/api/experiences/:experienceId` - PUT update experience
- [x] `/api/experiences/:experienceId` - DELETE experience
- [x] `/api/status/update` - POST update user status
- [x] `/api/status/:userId` - GET user status
- [x] `/api/status/batch` - POST get multiple statuses
- [x] `/api/status/logout/:userId` - POST set offline
- [x] `/api/upload-profile-photo` - POST upload photo to MinIO

### Frontend Components
- [x] Renamed "Home" tab to "Profile"
- [x] Tab navigation updated: activeTab === 'profile'
- [x] Profile Photo Upload section
- [x] Basic Information form
- [x] Professional Bio textarea
- [x] Your Resumes section (moved from Home)
- [x] Work Experience section with add/edit/delete
- [x] Admin Messages tab (conditional render for admins)
- [x] Browse Professionals in Messages sidebar
- [x] Notification click handler redirects to Messages

### Frontend State Management
- [x] `userBio` state
- [x] `experiences` array state
- [x] `showExperienceForm` boolean
- [x] `experienceForm` object with all fields
- [x] `profilePhotoUploading` loading state
- [x] `userStatuses` map for batch status
- [x] `currentUserStatus` online/offline indicator

### Frontend Functions
- [x] `fetchExperiences(userId)` - Load experiences
- [x] `handleAddExperience()` - Create new experience
- [x] `handleDeleteExperience(experienceId)` - Delete experience
- [x] `handleUpdateBio()` - Save bio to database
- [x] `handleProfilePhotoUpload(file)` - Upload to MinIO
- [x] `updateUserStatus(isOnline)` - Update status
- [x] Notification click handler for Messages tab redirect

### Integration Points
- [x] Routes registered in backend server.js
- [x] Socket.IO initialized and running
- [x] User status updated on login
- [x] Experiences fetched on mount
- [x] Bio initialized from user data
- [x] Icons imported: Briefcase, Plus

### Files Modified
- [x] `/backend/server.js` - Added route registrations
- [x] `/backend/routes/users.js` - Added profile photo endpoint
- [x] `/backend/routes/experiences.js` - Created (NEW)
- [x] `/backend/routes/status.js` - Created (NEW)
- [x] `/backend/scripts/init-db.sql` - Added 3 new tables
- [x] `/frontend/src/pages/UserDashboard.js` - Major restructuring

### Documentation Created
- [x] `FEATURE_UPDATE_SUMMARY.md` - Complete feature overview
- [x] `API_ENDPOINTS.md` - All endpoint documentation
- [x] `USER_GUIDE.md` - User-facing feature guide
- [x] `TESTING_CHECKLIST.md` - This file

---

## 🧪 Testing Instructions

### Prerequisites
1. PostgreSQL running on localhost:5432
2. MinIO running and configured
3. Backend environment variables set (.env)
4. Frontend environment variables set (.env)

### Backend Testing

#### 1. Start Backend Server
```bash
cd backend
npm install
npm start
```
Expected output:
- Socket.IO initialized
- Database connected
- Server running on port 5000

#### 2. Test Experiences API
```bash
# Create experience
curl -X POST http://localhost:5000/api/experiences \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-uuid-here",
    "jobTitle": "Software Engineer",
    "companyName": "Tech Corp",
    "startDate": "2022-01-15",
    "isCurrent": true
  }'

# Get experiences
curl http://localhost:5000/api/experiences/user/user-uuid-here

# Update experience
curl -X PUT http://localhost:5000/api/experiences/exp-uuid-here \
  -H "Content-Type: application/json" \
  -d '{"jobTitle": "Senior Engineer"...}'

# Delete experience
curl -X DELETE http://localhost:5000/api/experiences/exp-uuid-here
```

#### 3. Test Status API
```bash
# Update status
curl -X POST http://localhost:5000/api/status/update \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-uuid", "isOnline": true}'

# Get status
curl http://localhost:5000/api/status/user-uuid

# Batch get statuses
curl -X POST http://localhost:5000/api/status/batch \
  -H "Content-Type: application/json" \
  -d '{"userIds": ["uuid1", "uuid2", "uuid3"]}'
```

#### 4. Test Profile Photo Upload
```bash
curl -X POST http://localhost:5000/api/upload-profile-photo \
  -F "file=@/path/to/photo.jpg" \
  -F "userId=user-uuid-here"
```

### Frontend Testing

#### 1. Login
- Navigate to login page
- Login with test credentials
- Verify you're redirected to UserDashboard

#### 2. Profile Tab
- [ ] Navigate to Profile tab
- [ ] See profile photo section at top
- [ ] Click "Change Photo" and upload a test image
- [ ] Verify photo updates and appears in sidebar
- [ ] Fill in Basic Information form
- [ ] Click "Save Changes"
- [ ] Verify profile updated (refresh page to confirm)
- [ ] Write a bio in "About You" section
- [ ] Click "Save Bio"
- [ ] Upload a resume
  - [ ] Click "Upload New Resume"
  - [ ] Select a PDF/DOC file
  - [ ] Verify it appears in list
  - [ ] Click "View" to see in modal
  - [ ] Click "Close" to close modal
  - [ ] Delete the resume
- [ ] Add a work experience
  - [ ] Click "Add Experience"
  - [ ] Fill in Job Title: "Senior Developer"
  - [ ] Fill in Company: "Tech Corp"
  - [ ] Check "Current" checkbox
  - [ ] Add description
  - [ ] Click "Add Experience"
  - [ ] Verify experience appears in list
  - [ ] Click trash to delete it

#### 3. Messages Tab
- [ ] Click Messages tab
- [ ] See Conversation Count (e.g., "2/5 conversations used")
- [ ] See Browse Professionals sidebar with 10 users
- [ ] Click "Message" on a professional
- [ ] Verify chat window opens
- [ ] Type a message and send it
- [ ] Receive message in real-time (or within 5 seconds)
- [ ] Search for a conversation
- [ ] See last message preview update

#### 4. Admin Messages Tab (if admin)
- [ ] Verify "Admin Messages" tab appears in navbar
- [ ] Click to open
- [ ] See admin-sent messages

#### 5. Notifications Tab
- [ ] Click Notifications tab
- [ ] See all notifications listed
- [ ] Click on a message notification
  - [ ] Verify redirected to Messages tab
  - [ ] Verify notification marked as read
- [ ] Click on admin notification (if applicable)

#### 6. Profile Menu
- [ ] Click profile photo/dropdown in navbar
- [ ] Verify menu shows your name and email
- [ ] See "Upgrade to Premium" option (if not premium)
- [ ] Click Logout
- [ ] Verify redirected to login

### Integration Testing

#### 1. Message Persistence
- [ ] Send a message
- [ ] Refresh the page
- [ ] Verify message still appears in chat
- [ ] Open same conversation on another browser/device
- [ ] Verify message visible in other instance

#### 2. Experience Persistence
- [ ] Add an experience
- [ ] Refresh the page
- [ ] Verify experience still appears
- [ ] Open profile in incognito window
- [ ] Verify experience visible

#### 3. Online Status (Backend Ready)
- [ ] Login to one user
- [ ] Status set to online (backend handles)
- [ ] Logout
- [ ] Status set to offline (backend handles)
- [ ] Open another user's conversations
- [ ] (Future) Should show green dot for online users

#### 4. Profile Photo Sync
- [ ] Upload profile photo in Profile tab
- [ ] Go to Messages tab
- [ ] Verify updated photo shows in chat header
- [ ] Go to Home/Browse Professionals
- [ ] (If shown) Verify updated photo displays

#### 5. Conversation Limit (Free Users)
- [ ] Create 5 conversations as free user
- [ ] Try to create 6th conversation
- [ ] Verify error or premium upgrade prompt
- [ ] (If popup exists) Click upgrade

### Database Testing

#### 1. Verify Tables Created
```bash
# Connect to PostgreSQL
psql -U admin -d skill_connect_db

# List tables
\dt

# Should see:
# - user_experiences
# - user_status
# - message_read_receipts

# Check table structure
\d user_experiences
\d user_status
\d message_read_receipts
```

#### 2. Verify Data
```sql
-- Check if experiences exist
SELECT * FROM user_experiences WHERE user_id = 'your-user-uuid';

-- Check user status
SELECT * FROM user_status WHERE user_id = 'your-user-uuid';

-- Check read receipts
SELECT * FROM message_read_receipts;

-- Check user bio
SELECT id, fullname, bio FROM users WHERE id = 'your-user-uuid';
```

---

## 🐛 Common Issues & Solutions

### Issue: Profile photo upload fails
**Solution:**
- Check file size (must be < 5MB)
- Verify format (JPG or PNG only)
- Check MinIO is running and configured correctly
- Check backend logs for upload errors

### Issue: Experiences not appearing
**Solution:**
- Verify database migration ran (check `user_experiences` table exists)
- Check backend is running
- Check browser console for errors
- Try refreshing the page

### Issue: Messages not sending
**Solution:**
- Verify you're not exceeding conversation limit (free users: 5 max)
- Check user is selected
- Verify message is not empty
- Check backend logs for errors
- Try refreshing and re-logging in

### Issue: Admin Messages tab doesn't appear
**Solution:**
- Verify `user.is_admin` is true in the database for your user
- Check backend returns `is_admin` in user data
- Refresh the page

### Issue: Bio not saving
**Solution:**
- Check database has `bio` column in users table
- Verify `/api/user/:userId/update` endpoint is working
- Check network tab in browser dev tools for errors

### Issue: Socket.IO not connecting
**Solution:**
- Verify Socket.IO is initialized in backend (check logs)
- Check firewall isn't blocking WebSocket
- Try incognito mode (clears cache)
- Check backend port is accessible
- Fallback polling should work even if WebSocket fails

---

## 📊 Performance Benchmarks

Expected performance metrics:

| Operation | Expected Time | Threshold |
|-----------|---------------|-----------|
| Load Profile | < 500ms | < 1s |
| Upload Profile Photo | < 2s | < 5s |
| Add Experience | < 500ms | < 2s |
| Fetch Conversations | < 1s | < 2s |
| Send Message | < 500ms | < 2s |
| Receive Message (RT) | < 100ms | < 500ms |
| Receive Message (Polling) | < 5.5s | < 6s |
| Load Profile Tab Content | < 1s | < 2s |

---

## ✨ Post-Testing Cleanup

1. Delete test files created during testing
2. Clear test data from database (optional)
3. Test with production database
4. Verify all features work in production environment

---

## 📝 Sign-Off Checklist

Before marking as complete:

- [ ] All 4 database tables created successfully
- [ ] All 9 backend endpoints tested and working
- [ ] All frontend components render correctly
- [ ] Profile tab fully functional
- [ ] Messages tab working with Browse Professionals
- [ ] Admin Messages tab appears for admin users
- [ ] No console errors on frontend
- [ ] No backend error logs
- [ ] Profile photo upload to MinIO working
- [ ] Experiences CRUD fully functional
- [ ] Bio save/update working
- [ ] Notification click handler working
- [ ] Online status tracking initialized (backend)
- [ ] No security issues found
- [ ] Performance acceptable
- [ ] Mobile responsiveness verified (if applicable)

