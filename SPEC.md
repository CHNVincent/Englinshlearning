# English Pronunciation Practice Web Application - Specification

## 1. Project Overview

**Project Name**: EnglishEcho - 英语跟读练习应用

**Project Type**: Full-stack Web Application (Deployable)

**Core Functionality**: A pronunciation practice platform where users can listen to British/American English samples and record their own pronunciation, receiving instant feedback with color-coded scoring (green/yellow/red).

**Target Users**: 
- English learners wanting to improve pronunciation
- Language schools for classroom practice
- Administrators managing learning content

---

## 2. Technical Architecture

### 2.1 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + TypeScript + Vite |
| Backend | Node.js + Express + TypeScript |
| Database | SQLite + Prisma ORM |
| TTS (Text-to-Speech) | Google Translate TTS API (free) |
| Voice Recognition | Web Speech API |
| Styling | CSS Modules CSS |
| Deployment + Custom | Docker + Docker Compose |

### 2.2 Project Structure

```
english-echo/
├── backend/                 # Express API server
│   ├── src/
│   │   ├── controllers/     # Request handlers
│   │   ├── services/        # Business logic
│   │   ├── routes/          # API routes
│   │   ├── prisma/          # Database schema
│   │   └── index.ts         # Entry point
│   ├── package.json
│   └── tsconfig.json
├── frontend/                # React application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API calls
│   │   ├── styles/          # CSS files
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
└── docker-compose.yml       # Deployment config
```

---

## 3. UI/UX Specification

### 3.1 Color Palette

| Color | Hex Code | Usage |
|-------|----------|-------|
| Primary | #4F46E5 | Buttons, active states |
| Primary Dark | #3730A3 | Hover states |
| Secondary | #10B981 | Success/Green score |
| Warning | #F59E0B | Yellow/Average score |
| Error | #EF4444 | Red/Wrong score |
| Background | #F8FAFC | Page background |
| Surface | #FFFFFF | Cards, panels |
| Text Primary | #1E293B | Main text |
| Text Secondary | #64748B | Subtitle text |
| Border | #E2E8F0 | Dividers, borders |

### 3.2 Typography

| Element | Font | Size | Weight |
|---------|------|------|--------|
| Heading 1 | Inter | 32px | 700 |
| Heading 2 | Inter | 24px | 600 |
| Heading 3 | Inter | 20px | 600 |
| Body | Inter | 16px | 400 |
| Small | Inter | 14px | 400 |
| Caption | Inter | 12px | 400 |

### 3.3 Layout Structure

**Header (64px height)**
- Logo (left): "EnglishEcho" with headphone icon
- Navigation (center): Home, Practice, Admin
- User info (right): Login/Logout button

**Main Content**
- Max width: 1200px
- Centered with padding: 24px

**Footer (48px height)**
- Copyright text centered

### 3.4 Page Specifications

#### 3.4.1 Home Page (/)
- Hero section with welcome message
- Quick start button to practice
- Featured sentences preview (random 3)
- Statistics display (total sentences, users)

#### 3.4.2 Practice Page (/practice)
- Sentence display card (large text)
- Audio player with British/American toggle
- Record button (large, prominent)
- Real-time waveform visualization
- Score display with color coding:
  - Green (#10B981): Score ≥ 80%
  - Yellow (#F59E0B): Score 60-79%
  - Red (#EF4444): Score < 60%
- Word-by-word scoring breakdown
- Next/Previous sentence navigation

#### 3.4.3 Admin Page (/admin)
- Login required (simple password protection)
- Sentence management table
- Add new sentence form:
  - English text input
  - Category dropdown
  - Difficulty level (1-5)
- Bulk import option (CSV)
- Audio generation status indicator

---

## 4. Functionality Specification

### 4.1 Core Features

#### 4.1.1 Sentence Management (Admin)
- **Create**: Add new sentences with text, category, difficulty
- **Read**: View all sentences with pagination
- **Update**: Edit existing sentences
- **Delete**: Remove sentences (soft delete)
- **Audio Generation**: Auto-generate British and American TTS on creation

#### 4.1.2 Pronunciation Playback
- Play British English pronunciation (en-GB)
- Play American English pronunciation (en-US)
- Download audio files
- Speed control (0.75x, 1x, 1.25x)

#### 4.1.3 Voice Recording & Scoring
- Record user's voice via browser
- Real-time recording indicator
- Compare against reference audio
- Calculate similarity score (0-100%)
- Display word-level breakdown

#### 4.1.4 Scoring Algorithm
The scoring system uses:
1. **Speech Recognition**: Convert user audio to text
2. **Text Comparison**: Levenshtein distance between recognized and target text
3. **Phonetic Analysis**: Compare phonemes using Web Speech API
4. **Final Score**: Weighted combination (text match 60%, phonetic 40%)

### 4.2 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/sentences | List all sentences (paginated) |
| GET | /api/sentences/:id | Get single sentence |
| POST | /api/sentences | Create new sentence |
| PUT | /api/sentences/:id | Update sentence |
| DELETE | /api/sentences/:id | Delete sentence |
| GET | /api/sentences/:id/audio/:accent | Get audio file URL |
| POST | /api/sentences/generate-audio | Generate TTS for sentence |
| POST | /api/auth/login | Admin login |

### 4.3 Data Models

#### Sentence
```typescript
{
  id: number;
  text: string;           // English text
  category: string;       // e.g., "greeting", "business"
  difficulty: number;     // 1-5
  audioBritish: string;   // URL to British MP3
  audioAmerican: string;   // URL to American MP3
  audioStatus: string;    // "pending", "processing", "completed", "failed"
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
}
```

#### User (Optional for future)
```typescript
{
  id: number;
  username: string;
  passwordHash: string;
  role: "admin" | "user";
}
```

---

## 5. Deployment Specification

### 5.1 Docker Configuration

**Services**:
- `backend`: Node.js API on port 3001
- `frontend`: Nginx serving React app on port 80
- `volumes`: Persistent storage for SQLite and audio files

### 5.2 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Backend port | 3001 |
| DATABASE_URL | SQLite file path | ./dev.db |
| ADMIN_PASSWORD | Admin access password | admin123 |
| TTS_CACHE_DIR | Audio files directory | ./audio |

---

## 6. Acceptance Criteria

### 6.1 Functional Criteria

- [ ] User can view list of sentences
- [ ] User can play British English audio
- [ ] User can play American English audio
- [ ] User can record their pronunciation
- [ ] User receives score with color coding
- [ ] Admin can login with password
- [ ] Admin can add new sentences
- [ ] Admin can view/edit/delete sentences
- [ ] Audio files are generated automatically on sentence creation

### 6.2 Visual Checkpoints

- [ ] Header displays logo and navigation
- [ ] Practice page shows large readable text
- [ ] Record button is prominent and accessible
- [ ] Score colors match specification (green/yellow/red)
- [ ] Admin page has proper table layout
- [ ] Responsive design works on mobile

### 6.3 Technical Criteria

- [ ] Backend builds without errors
- [ ] Frontend builds without errors
- [ ] Docker compose starts all services
- [ ] Database migrations run successfully
- [ ] No console errors in production build

---

## 7. Initial Seed Data

The application will be pre-populated with 10 sample sentences:

1. "Hello, how are you today?" (greeting, level 1)
2. "The weather is beautiful." (casual, level 1)
3. "I would like a cup of coffee, please." (ordering, level 2)
4. "Could you help me find the nearest station?" (asking, level 2)
5. "What time does the meeting start?" (business, level 2)
6. "The project deadline is next Friday." (business, level 3)
7. "I completely understand your perspective on this matter." (formal, level 4)
8. "The economic situation has significantly improved over the past year." (formal, level 5)
9. "She sells seashells by the seashore." (tongue twister, level 3)
10. "The quick brown fox jumps over the lazy dog." (pangram, level 2)
