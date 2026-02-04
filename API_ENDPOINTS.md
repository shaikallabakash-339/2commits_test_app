# API Endpoints Reference

## Experiences API

### Get User Experiences
**GET** `/api/experiences/user/:userId`
- Returns all experiences for a user in reverse chronological order
- Response: `{ success: true, experiences: [...] }`

### Add Experience
**POST** `/api/experiences`
```json
{
  "userId": "uuid",
  "jobTitle": "Senior Engineer",
  "companyName": "Tech Corp",
  "startDate": "2022-01-15",
  "endDate": "2024-06-30",
  "isCurrent": false,
  "description": "Led team of 5 engineers..."
}
```
- Response: `{ success: true, experience: {...} }`

### Update Experience
**PUT** `/api/experiences/:experienceId`
- Same payload structure as POST
- Response: `{ success: true, experience: {...} }`

### Delete Experience
**DELETE** `/api/experiences/:experienceId`
- Response: `{ success: true, message: "Experience deleted successfully" }`

---

## User Status API

### Update User Status
**POST** `/api/status/update`
```json
{
  "userId": "uuid",
  "isOnline": true
}
```
- Response: `{ success: true, status: {...} }`

### Get Single User Status
**GET** `/api/status/:userId`
- Returns: `{ success: true, status: { user_id, is_online, last_seen } }`
- Returns offline status if user not found

### Get Multiple Users' Statuses (Batch)
**POST** `/api/status/batch`
```json
{
  "userIds": ["uuid1", "uuid2", "uuid3"]
}
```
- Response: `{ success: true, statuses: [{user_id, is_online, last_seen}, ...] }`
- Includes default offline status for not-found users

### Logout Status Update
**POST** `/api/status/logout/:userId`
- Sets `is_online = false` and updates `last_seen`
- Response: `{ success: true, status: {...} }`

---

## Profile Photo API

### Upload Profile Photo
**POST** `/api/upload-profile-photo`
- Multipart form data with file upload
- Fields:
  - `file`: Image file (JPG/PNG, max 5MB)
  - `userId`: User UUID
- Response: `{ success: true, imageUrl: "...", user: {...} }`
- Stores URL in `users.profile_image_url`

---

## User Update API (Existing)

### Update User Profile
**PUT** `/api/user/:userId/update`
```json
{
  "fullname": "John Doe",
  "company_name": "Tech Corp",
  "city": "San Francisco",
  "status": "employed",
  "bio": "Passionate about software engineering..."
}
```
- Email field is read-only
- Response: `{ success: true, user: {...} }`

---

## Messages API (Existing - Enhanced)

### Send Message with Attachments
**POST** `/api/user-message/send`
- Supports JSON (text only) or multipart/form-data (with attachments)
- Checks premium status for conversation limit (5 max for free users)
- Emits Socket.IO event: `new_message`

### Get Messages Between Users
**GET** `/api/user-message/:senderId/:receiverId`
- Returns messages with attachments
- Marks messages as read
- Returns conversation metadata

### Get Conversations
**GET** `/api/conversations/:userId`
- Returns list of user's conversations with:
  - `conversation_partner_id`
  - `conversation_partner_name`
  - `partner_profile_image_url`
  - `company_name`
  - `last_message`
  - `last_message_time`

---

## Socket.IO Events

### Connecting
```javascript
socket.on('connect', () => {
  socket.emit('join', userId);  // Join user room
});
```

### Receiving Messages
```javascript
socket.on('new_message', (payload) => {
  // payload: { message: {...}, from: userId }
});

socket.on('new_notification', () => {
  // Notification received, refresh notifications list
});
```

### Disconnecting
```javascript
socket.emit('leave', userId);
socket.disconnect();
```

---

## Frontend Function Reference

### Profile Functions
- `fetchExperiences(userId)` - Load user's experiences
- `handleAddExperience()` - Save new experience to database
- `handleDeleteExperience(experienceId)` - Delete experience
- `handleUpdateBio()` - Save bio to database
- `handleProfilePhotoUpload(file)` - Upload photo to MinIO

### Status Functions
- `updateUserStatus(isOnline)` - Update online/offline status
- `fetchUserStatus(userId)` - Get user's current status (if needed)

### Message Functions
- `fetchMessages(senderId, receiverId)` - Load conversation
- `fetchConversations(userId)` - Load all conversations
- `handleSendMessage()` - Send message with optional attachments
- `handleSelectUser(user)` - Select user to chat with

### Notification Functions
- `fetchNotifications(userId)` - Load notifications
- Notification click handler redirects to Messages tab

---

## Database Schema

### user_experiences Table
```sql
CREATE TABLE user_experiences (
  id UUID PRIMARY KEY,
  user_id UUID (FK users.id),
  job_title TEXT NOT NULL,
  company_name TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  is_current BOOLEAN DEFAULT false,
  description TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### user_status Table
```sql
CREATE TABLE user_status (
  id UUID PRIMARY KEY,
  user_id UUID UNIQUE (FK users.id),
  is_online BOOLEAN DEFAULT false,
  last_seen TIMESTAMP,
  updated_at TIMESTAMP
);
```

### message_read_receipts Table
```sql
CREATE TABLE message_read_receipts (
  id UUID PRIMARY KEY,
  message_id UUID (FK user_messages.id),
  reader_id UUID (FK users.id),
  read_at TIMESTAMP,
  UNIQUE(message_id, reader_id)
);
```

---

## Error Handling

All endpoints return standardized responses:

### Success Response
```json
{
  "success": true,
  "data": {...},
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error (development only)"
}
```

### Common HTTP Status Codes
- **200**: Success
- **400**: Bad request (missing required fields)
- **404**: Not found (resource doesn't exist)
- **500**: Server error

---

## Environment Variables

### Backend (.env)
- `DATABASE_URL` or individual DB config
- `MINIO_ENDPOINT`
- `MINIO_ACCESS_KEY`
- `MINIO_SECRET_KEY`
- `PORT` (default 5000)

### Frontend (.env)
- `REACT_APP_API_URL` (default: http://localhost:5000)
- `REACT_APP_SOCKET_URL` (default: same as API_URL)

