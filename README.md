![Sawa](https://sae8d.vercel.app/project5.jpg)
Sawa is a feature-rich, Arabic-first web application for discovering and exploring movies and TV series. It provides detailed information, user authentication, and a unique real-time synchronized "Watch Party" feature, all wrapped in a modern, animated, and responsive user interface.

## Features

-   **Comprehensive Media Library**: Browse trending, popular, and upcoming movies and series. Explore curated lists for Arabic, Turkish, Korean, and Anime content.
-   **Detailed Information**: Get in-depth details for any movie or series, including synopsis, ratings, cast, genres, trailers, and high-resolution images.
-   **Artist Profiles**: View detailed artist pages with biographies, filmographies, and social media links.
-   **Real-time Watch Parties**: Create or join rooms to watch content synchronously with friends. The feature includes a shared chat and synchronized video playback controls (play, pause, seek), powered by PartyKit.
-   **User Authentication**: Secure sign-up and login using email/password or Google, with complete profile management, powered by Firebase.
-   **Personalization**: Users can add items to their favorites, view their watch history, and receive personalized suggestions based on their preferred genres.
-   **Advanced Search**: A powerful multi-search to find movies, series, and artists.
-   **Dynamic UI**: A sleek, modern interface with smooth animations powered by GSAP and a fully responsive design.
-   **Infinite Scrolling**: Seamlessly load more content as you scroll through lists and search results.

## Tech Stack

-   **Framework**: [Next.js](https://nextjs.org/) (App Router)
-   **Language**: [TypeScript](https://www.typescriptlang.org/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/)
-   **Animations**: [GSAP (GreenSock Animation Platform)](https://gsap.com/)
-   **Real-time & Websockets**: [PartyKit](https://www.partykit.io/)
-   **Backend & Authentication**: [Firebase](https://firebase.google.com/) (Auth, Firestore)
-   **Data Source**: [The Movie Database (TMDB) API](https://www.themoviedb.org/)
-   **Form Handling**: [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/)
-   **Video Playback**: [HLS.js](https://hls-js.com/)

## Core Functionality

### Data Fetching (TMDB)

The application fetches all its media data from the TMDB API. A centralized fetching mechanism in `src/lib/tmdb.ts` handles API requests. The logic in the `src/data/` directory builds upon this to create specific, reusable data hooks.

-   `src/data/HandleRequests.ts`: A core wrapper that processes API responses, normalizes data into a consistent `MediaItem` interface, and translates genre IDs into readable names.
-   Category-specific functions (e.g., `fetch_popular_movies.ts`, `fetch_arabic_series.ts`) utilize `HandleRequests` to populate different sections of the app.
-   Server-side rendering (SSR) and Incremental Static Regeneration (ISR) are used for performance and SEO.

### Real-time Watch Party (PartyKit)

The "Watch Party" feature enables synchronized media consumption for multiple users.

-   **Server (`party/server.ts`)**: A PartyKit server manages the state for each party room. It tracks playback status (`isPlaying`, `currentTime`), handles events (`play`, `pause`, `seek`), and relays chat messages. When a user connects, they immediately receive the current room state to sync up.
-   **Client (`src/components/watch/PartyRoom.tsx`)**: The client uses the `usePartySocket` hook to maintain a persistent WebSocket connection. It sends user actions (like clicking "play") to the server and listens for state updates from the server to keep the local video player in sync with the group.

### User Authentication & Profiles (Firebase)

User management is handled by Firebase.

-   **Authentication**: Supports email/password registration and Google OAuth sign-in. Logic is centralized in `src/firebase/authActions.ts`.
-   **User Profiles**: After registration, users complete their profile (name, avatar, favorite genres). This data, along with their favorites and watch history, is stored in Firestore and managed via functions in `src/firebase/databaseActios.ts`.

## Project Structure

The repository is a standard Next.js application with a clear separation of concerns.

```
/
├── public/                # Static assets (images, icons)
├── party/                 # PartyKit server-side logic
│   └── server.ts          # WebSocket server for watch parties
├── src/
│   ├── app/               # Next.js App Router: pages, layouts, API routes
│   ├── components/        # Reusable React components (UI, auth, details)
│   ├── data/              # Data fetching and shaping logic for TMDB
│   ├── firebase/          # Firebase config and action handlers
│   ├── hooks/             # Custom React hooks (e.g., useInfiniteScroll)
│   ├── lib/               # Core utilities (cn, TMDB wrapper)
│   └── validations/       # Zod schemas for form validation
├── next.config.ts         # Next.js configuration
└── package.json           # Project dependencies and scripts
```

## Running Locally

To run this project on your local machine, follow these steps:

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/saeedm0hamed/sawa-web.git
    cd sawa-web
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up Environment Variables:**
    Create a `.env.local` file in the root of the project and add the necessary API keys and configuration from Firebase and TMDB.

    ```bash
    # .env.local

    # Firebase Configuration
    NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
    NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id

    # TMDB API Configuration
    TMDB_API_KEY=your_tmdb_api_key
    TMDB_BASE_URL=https://api.themoviedb.org/3
    ```

4.  **Run the development servers:**
    You need to run two separate processes: the Next.js app and the PartyKit server.

    -   **Start the Next.js app:**
        ```bash
        npm run dev
        ```

    -   **Start the PartyKit server (in a separate terminal):**
        ```bash
        npx partykit dev
        ```

5.  **Open the application:**
    Navigate to `http://localhost:3000` in your web browser.
