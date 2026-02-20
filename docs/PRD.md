# Product Requirements Document: VidGrid

**Version:** 1.0
**Status:** Draft
**Date:** February 15, 2026

## 1. Executive Summary
VidGrid is a lightweight, single-page web application designed for desktop browsers. Its primary purpose is to display up to four video streams simultaneously in a 2x2 grid layout. The application prioritizes simplicity and speed, requiring no user authentication or backend database.

## 2. Target Audience
*   **Primary:** Users who need to monitor multiple live feeds or video playlists simultaneously (e.g., security monitoring, live event tracking, multi-platform social media viewing).
*   **Secondary:** Users seeking a distraction-free environment to watch multiple content sources at once.

## 3. User Interface & Navigation
The application consists of two main views:

### 3.1 Global Elements
*   **Header:** Persistent across all pages.
*   **Navigation:** Simple text links or buttons for "Play" and "Settings."
*   **Responsiveness:** The application is optimized for **Desktop Only**. Mobile responsiveness is out of scope for Version 1.0.

### 3.2 Page 1: Play Page (Default Landing)
*   **Layout:** A 2x2 grid that fills the majority of the viewport.
*   **Positions:**
    *   Top-Left
    *   Top-Right
    *   Bottom-Left
    *   Bottom-Right
*   **Behavior:**
    *   Each quadrant contains a video player.
    *   If a URL is provided for a specific quadrant, the video plays automatically (if the stream protocol allows).
    *   If no URL is provided, the quadrant displays a placeholder image or neutral color with text indicating "No Stream Configured."
    *   **Controls:** Standard HTML5 video controls (Play/Pause, Mute, Fullscreen) should be visible on hover.

### 3.3 Page 2: Settings Page
*   **Layout:** A simple vertical form layout.
*   **Input Fields:** Four distinct text input fields labeled by their position on the grid:
    1.  Top-Left Stream URL
    2.  Top-Right Stream URL
    3.  Bottom-Left Stream URL
    4.  Bottom-Right Stream URL
*   **Action Button:** A "Save" button.
*   **Feedback:** Upon clicking "Save," a success message (e.g., "Settings Saved") briefly appears.

## 4. Functional Requirements

### 4.1 Authentication
*   **FR-01:** The application shall have no login screen, user accounts, or password recovery flows.
*   **FR-02:** All settings are stored locally on the user's machine (see Data Storage).

### 4.2 Video Playback
*   **FR-03:** The application must support standard video formats playable by HTML5 `<video>` tags (e.g., MP4, WebM).
*   **FR-04:** The application should support HTTP Live Streaming (HLS/m3u8) streams via a library like HLS.js, as many live streams use this format.
*   **FR-05:** Audio for all streams should default to **Muted** to prevent audio cacophony upon loading. Users can manually unmute individual streams.

### 4.3 Configuration Management
*   **FR-06:** Users must be able to input valid video URLs into the fields on the Settings page.
*   **FR-07:** Clicking "Save" must persist the URLs to the browser's Local Storage.
*   **FR-08:** Navigating back to the Play page must immediately load the videos using the newly saved URLs.

## 5. Non-Functional Requirements

### 5.1 Performance
*   **NFR-01:** The application must load instantly (as it is a lightweight client-side app).
*   **NFR-02:** The grid layout must not break (e.g., overlap or shift violently) if one video fails to load.

### 5.2 Compatibility
*   **NFR-03:** The application must function correctly on the latest versions of Chrome, Firefox, Safari, and Edge (Desktop).

## 6. Data Storage
*   **DS-01:** All configuration data (the 4 URLs) will be stored in the browser's **Local Storage**.
*   **DS-02:** Data schema:
    ```json
    {
      "topLeft": "https://url.com/video.mp4",
      "topRight": "https://url.com/stream.m3u8",
      "bottomLeft": "",
      "bottomRight": "https://url.com/video.webm"
    }
    ```
*   **DS-03:** No data is sent to an external server.

## 7. Future Considerations (Out of Scope for V1)
*   Customizable grid layouts (e.g., 1 large video + 3 small).
*   User authentication to save settings across devices.
*   Volume normalization.

## 7. Technology stack
* AstroJS 
* Tailwind 4+
* Bun 1.3+
* All code is contained in the `app/` directory.
* All technologies are very new so please use **zread** to look up documentation and API specifications without me having to prompt you each time.
