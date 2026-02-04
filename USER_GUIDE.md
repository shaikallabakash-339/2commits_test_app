# UserDashboard - Complete Feature Guide

## Overview

The UserDashboard has been completely redesigned with a new tab structure, enhanced profile management, and improved messaging experience. This guide walks you through all the new features.

---

## Tab Structure

### 1. **Profile Tab** (Home → Profile)

The Profile tab is now your personal profile hub where you can manage all your professional information.

#### Profile Photo
- Click "Change Photo" to upload a new profile picture
- Supported formats: JPG, PNG
- Max file size: 5MB
- Photo is uploaded to MinIO and displayed across the platform

#### Basic Information
- **Full Name**: Edit your name
- **Email**: Read-only (cannot be changed here)
- **Company Name**: Your current or previous company
- **City**: Your location
- **Current Status**: Pursuing/Graduated/Employed
- Click "Save Changes" to update

#### About You (Bio)
- Write a professional bio (max 500 characters)
- Appears on your profile
- Shows character count as you type
- Save with "Save Bio" button

#### Your Resumes
- Upload multiple resume files (PDF, DOC, DOCX)
- Click "Upload New Resume" to add a resume
- View resume in a modal popup
- Delete resumes you no longer need
- Shows upload date for each resume

#### Work Experience
- Add multiple work experiences
- Fields:
  - Job Title (required)
  - Company Name (required)
  - Start Date (optional)
  - End Date (optional, disabled if "Current" is checked)
  - Current Role (checkbox)
  - Description (optional)
- Experiences listed in reverse chronological order (newest first)
- Click trash icon to delete an experience
- Shows date range or "Current" for active positions

---

### 2. **Messages Tab**

Chat with professionals on your network with an organized interface.

#### Conversations List (Left Sidebar)
- **Search**: Find conversations by name or company
- **Conversation Limit**: Shows your usage (e.g., 3/5 conversations)
  - Free users: Maximum 5 conversations
  - Premium users: Unlimited conversations
- **Conversation Items**: Click to open chat
  - Shows user avatar
  - Displays name and last message preview
  - Highlights current conversation

#### Browse Professionals (In Conversations Sidebar)
- Shows 10 professionals from your network
- Quick way to start new conversations
- Each item shows:
  - Profile photo
  - Name and company
  - "Message" button to start chatting

#### Chat Area (Main)
- **Chat Header**: Shows the person's name, company, and avatar
- **Messages Display**:
  - Smooth scrolling
  - Messages grouped by sender
  - File attachments display inline (images, videos, documents)
- **Message Input**:
  - Type your message
  - Attach files (if file attachment is supported)
  - Press Send or Ctrl+Enter to send

#### Features
- Real-time updates via Socket.IO
- Fallback polling every 5 seconds if WebSocket is unavailable
- Message attachments (images, files, videos, documents)
- Automatic conversation creation on first message
- Premium conversation limit enforcement

---

### 3. **Admin Messages Tab** (Admin Only)

If you're an admin, you'll see an additional tab for admin communications.

- View messages sent by administrators
- Separate from regular user messages
- Shows all admin notifications and announcements
- May include clickable URLs and important links

---

### 4. **Notifications Tab**

Stay updated with all platform notifications.

#### Notification Types
- **Message Notifications**: When someone sends you a message
- **Admin Notifications**: System announcements and admin messages
- **Other Notifications**: Platform updates and important info

#### Notification Actions
- Click on a notification to:
  - Mark it as read
  - Navigate to the relevant section (e.g., Messages tab for message notifications)
- Unread count badge shows pending notifications

---

## How to Use Each Feature

### Adding a Work Experience

1. Go to **Profile** tab
2. Scroll to "Work Experience" section
3. Click "Add Experience" button
4. Fill in the form:
   - Enter Job Title (e.g., "Senior Software Engineer")
   - Enter Company Name (e.g., "Google")
   - Select Start Date
   - Select End Date (or check "Current" if ongoing)
   - Add optional description
5. Click "Add Experience"
6. Experience appears in the list

### Updating Your Bio

1. Go to **Profile** tab
2. Scroll to "About You" section
3. Type or paste your bio (max 500 characters)
4. Click "Save Bio"
5. Bio is updated and displayed on your profile

### Uploading Profile Photo

1. Go to **Profile** tab
2. Scroll to top - "Profile Photo" section
3. Click "Change Photo"
4. Select a JPG or PNG image (max 5MB)
5. Photo is automatically uploaded and displayed
6. Photo updates across entire platform (sidebar, messages, etc.)

### Starting a Conversation

**Method 1: From Browse Professionals**
1. Go to **Messages** tab
2. Look at "Browse Professionals" in left sidebar
3. Click "Message" button next to the person
4. Chat window opens with that professional

**Method 2: From Search**
1. Go to **Messages** tab
2. In main area, look for search or user list (if available)
3. Click on a user to start messaging

### Sending a Message

1. Select a conversation or open a chat
2. Type your message in the input field
3. (Optional) Attach a file by clicking the attachment button
4. Click "Send" or press Ctrl+Enter
5. Message appears in your chat thread
6. Recipient receives the message in real-time (or via polling)

### Managing Resumes

**Upload Resume:**
1. Profile tab → "Your Resumes"
2. Click "Upload New Resume"
3. Select a PDF, DOC, or DOCX file
4. Resume appears in the list

**View Resume:**
1. Click "View" button on any resume
2. Resume opens in a modal window
3. Click "Close" to close the modal

**Delete Resume:**
1. Click trash icon on the resume
2. Resume is deleted from your profile

---

## Status & Online/Offline

### Your Status
- You automatically appear **online** when you log in
- You appear **offline** when you log out
- Status updates are tracked in real-time via the `/api/status/` endpoints

### Viewing Others' Status
- When messaging, you can see if a person is online (green indicator)
- Last seen timestamp shows when they were last active
- Feature is backend-ready, frontend display coming soon

---

## Conversation Limits

### Free Users
- Maximum 5 active conversations
- Cannot exceed 5 without upgrading
- Warning shows in Messages tab: "3/5 conversations used"

### Premium Users
- Unlimited conversations
- Shows "Unlimited conversations" indicator
- Upgrade button in profile dropdown

---

## Data Storage

### Cloud Storage (MinIO S3-Compatible)
- Profile photos
- Resume files
- Message attachments

### Database Storage (PostgreSQL)
- Profile information (name, email, company, city, bio, etc.)
- Experiences (work history)
- Messages (text content)
- Conversation metadata
- User status (online/offline)
- Attachments metadata (filenames, types, URLs)

---

## Backend Integration

All features are fully integrated with the backend:

```
Frontend        Backend             Database        Cloud Storage
─────────────   ──────────────      ──────────      ─────────────
Profile Form    /api/user/:id/      users table     (bio, name, city)
  ↓             update              ↑
Messages        /api/user-message   user_messages   MinIO (attachments)
  ↓             /send               ↑
Experiences     /api/experiences    user_experiences
  ↓             (CRUD)              ↑
Photo Upload    /api/upload-profile users.profile_  MinIO (photos)
  ↓             photo               image_url       ↑
Status          /api/status         user_status
  ↓             (update/get)        ↑
```

---

## Real-Time Features

### Socket.IO Events
- **new_message**: Someone sent you a message
- **new_notification**: New notification received
- **user_online**: User came online (future feature)
- **user_offline**: User went offline (future feature)

### Fallback Polling
- If WebSocket connection fails, automatically polls every 5 seconds
- Ensures messages are delivered even without real-time connection
- Seamless experience for users with network limitations

---

## Keyboard Shortcuts

- **Ctrl+Enter** or **Cmd+Enter**: Send message (in message input)
- **Tab**: Navigate between form fields
- **Escape**: Close modals/popups

---

## Troubleshooting

### Profile Photo Won't Upload
- Check file size (must be less than 5MB)
- Verify format (JPG or PNG only)
- Check your internet connection
- Try refreshing the page

### Experience Won't Save
- Ensure Job Title and Company Name are filled
- Check all required fields are completed
- Verify dates are valid
- Check browser console for errors

### Messages Not Sending
- Ensure you've selected a user to chat with
- Check if message field is empty
- Verify conversation limit hasn't been exceeded (free users: 5 max)
- Check internet connection
- Try refreshing the page

### Resume Upload Failed
- Ensure file is PDF, DOC, or DOCX
- Check file size
- Verify you're not exceeding storage limit
- Try different file format

---

## Performance Tips

1. **Faster Messaging**: Enable browser notifications for real-time updates
2. **Mobile**: Use responsive design - app adapts to smaller screens
3. **Multiple Chats**: Switch between conversations quickly without reloading
4. **Search**: Use conversation search to find past chats faster

---

## Security & Privacy

- All profile data is encrypted in transit (HTTPS)
- Resume files stored securely on MinIO
- Profile photos can be seen by other users (public)
- Messages are private between conversation participants
- Only admin can see admin messages section

---

## Future Enhancements

Coming soon:
- Message read receipts (double tick marks)
- Emoji support in messages
- Video/voice call integration
- Message search within conversations
- Typing indicators ("John is typing...")
- Message reactions (👍, ❤️, etc.)
- Group conversations

---

## Support

For issues or feature requests, contact the development team or check the documentation at:
- API Endpoints: See `API_ENDPOINTS.md`
- Feature Summary: See `FEATURE_UPDATE_SUMMARY.md`

