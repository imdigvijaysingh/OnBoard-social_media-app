# Project Updates Log

## Date: June 11, 2026

Today we made significant improvements to the app's design, fixed several major authentication bugs, and added powerful new features regarding user profiles and post management.

### ✨ New Features & Improvements
- **Complete Visual Overhaul**: Redesigned the Landing Page and application layout using a beautiful, premium light/indigo theme featuring modern glassmorphism effects and clean white cards.
- **Dynamic Age Display**: The Feed sidebar now actively fetches the logged-in user's profile data, automatically calculates their age from their Date of Birth, and displays it in a clean "username | age" format.
- **Cinematic Loading Animations**: Added sophisticated, full-screen blur overlays with loading spinners across all major actions. You now get a smooth 2-second animation when: Signing Up, Logging In, Creating a Profile, Creating a Post, and Logging Out.
- **Resend OTP Functionality**: Added a highly requested "Resend OTP" button on the verification screen so users aren't locked out if their code expires.
- **Dynamic Post Authors**: Posts are no longer anonymous! The database now securely attaches the creator to every post, and the feed dynamically displays the real avatar and username of whoever created the post.
- **Delete Your Own Posts**: You can now delete posts! If you are the creator of a post, a red trash icon will appear on it.
- **Custom Delete Modal**: Instead of using an old-fashioned browser pop-up, we built a beautiful custom React component (`DeleteConfirmModal`) with smooth animations to confirm post deletions.

### 🐛 Bugs & Problems Solved
- **Invalid OTP Bug**: Fixed a routing issue where the frontend and backend were mismatching methods, which incorrectly caused an "invalid otp" error even when the right code was entered.
- **401 Unauthorized / Session Timeouts**: Fixed a critical issue where the frontend was "forgetting" the user's login session. We solved this by strictly adding `{ withCredentials: true }` to all Axios API requests across the board.
- **Login Loop Prevention**: Fixed a problem where users who verified their email but failed to create a profile were getting stuck. Now, if you log in and don't have a profile setup, the system smartly detects it and sends you straight to the "Create Profile" screen.
- **Log Out Button Styling**: Fixed a minor CSS bug where a weird native browser outline was appearing around the "Log Out" button when clicked.

---
*(Future updates will be logged below)*
