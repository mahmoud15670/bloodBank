# Blood Bank App

A Flutter application for blood bank management with local notifications.

## Features

- Local notifications that work even when the app is closed
- Sync same blood inventory with Firebase Realtime Database
- Capture and share the report image via WhatsApp
- Schedule reminders for blood donations
- Immediate notification display

## Getting Started

### Prerequisites

- Flutter SDK installed
- Android Studio or VS Code with Flutter extension

### Installation

1. Clone the repository
2. Run `flutter pub get` to install dependencies
3. Run `flutter run` to start the app

## Usage

- Press "Show Notification Now" to display an immediate notification
- Press "Schedule Notification in 5 seconds" to schedule a notification

## Permissions

The app requires the following permissions:

- POST_NOTIFICATIONS
- SCHEDULE_EXACT_ALARM
- WAKE_LOCK
- VIBRATE
- RECEIVE_BOOT_COMPLETED
- INTERNET

## Dependencies

- flutter_local_notifications: ^21.0.0
- timezone: ^0.11.0
