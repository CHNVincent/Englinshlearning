export interface Sentence {
  id: number;
  text: string;
  category: string;
  difficulty: number;
  audioBritish: string | null;
  audioAmerican: string | null;
  audioStatus: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  sessionId: string;
  username: string;
  expiresAt: string;
}

export interface Stats {
  totalSentences: number;
  byCategory: { category: string; count: number }[];
  byDifficulty: { difficulty: number; count: number }[];
  audioStatus: { status: string; count: number }[];
}

export interface ScoreResult {
  score: number;
  recognizedText: string;
  wordScores: WordScore[];
}

export interface WordScore {
  word: string;
  isCorrect: boolean;
  score: number;
}
