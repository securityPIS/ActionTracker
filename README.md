# ActionTracker

A React-based task monitoring application for tracking projects, subtasks, and user assignments.

## Features

-   **Dashboard**: Overview of project progress, subtask status, and team workload.
-   **Task Management**: Create projects, add subtasks, assign users, and set deadlines.
-   **User Management**: Manage team members (PIC, Assignee) and their roles.
-   **File Manager**: View and search uploaded evidence files.
-   **Responsive Design**: Optimized for both desktop and mobile views.

## Tech Stack

-   **Frontend**: React (Vite)
-   **Styling**: Tailwind CSS
-   **Icons**: Lucide React
-   **State Management**: Local State + LocalStorage (Migrating to Firebase)

## Getting Started

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Run Development Server**:
    ```bash
    npm run dev
    ```

3.  **Build for Production**:
    ```bash
    npm run build
    ```

## Project Structure

-   `src/App.jsx`: Main application component containing all logic and UI.
-   `src/index.css`: Global styles and Tailwind directives.
-   `src/main.jsx`: Entry point mounting the App component.
