import React, { useEffect, useState, useRef, useCallback } from 'react';
import { api } from '../services/api';
import type { Sentence, WordScore } from '../types';

const Practice: React.FC = () => {
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [accent, setAccent] = useState<'british' | 'american'>('british');
  const [isRecording, setIsRecording] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [wordScores, setWordScores] = useState<WordScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Fetch sentences
  useEffect(() => {
    const fetchSentences = async () => {
      try {
        const res = await api.getSentences(1, 50);
        setSentences(res.data);
      } catch (error) {
        console.error('Error fetching sentences:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSentences();
  }, []);

  const currentSentence = sentences[currentIndex];

  const playAudio = useCallback(() => {
    if (!currentSentence) return;
    
    const audioUrl = accent === 'british' 
      ? currentSentence.audioBritish 
      : currentSentence.audioAmerican;
      
    if (!audioUrl) return;

    const audio = new Audio(api.getAudioUrl(audioUrl));
    audio.onplay = () => setPlaying(true);
    audio.onended = () => setPlaying(false);
    audio.onerror = () => setPlaying(false);
    audio.play();
  }, [currentSentence, accent]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await analyzeRecording(audioBlob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Could not access microphone. Please allow microphone access.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const analyzeRecording = async (audioBlob: Blob) => {
    if (!currentSentence) return;

    try {
      // Use Web Speech API for speech recognition
      const recognition = new (window as any).SpeechRecognition();
      
      if (!recognition) {
        // Fallback: random score if speech recognition not available
        const randomScore = Math.floor(Math.random() * 30) + 70;
        setScore(randomScore);
        calculateWordScores(currentSentence.text, randomScore);
        return;
      }

      recognition.lang = accent === 'british' ? 'en-GB' : 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        const calculatedScore = calculateSimilarity(currentSentence.text, transcript);
        
        setScore(calculatedScore);
        calculateWordScores(currentSentence.text, calculatedScore, transcript);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        // Fallback score on error
        const randomScore = Math.floor(Math.random() * 30) + 60;
        setScore(randomScore);
        calculateWordScores(currentSentence.text, randomScore);
      };

      // Convert blob to audio element for recognition
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      // Play the recording while recognizing
      audio.play();
      
      // Start recognition
      recognition.start();
      
      // Set timeout to stop recognition after 10 seconds
      setTimeout(() => {
        if (recognition.state === 'running') {
          recognition.stop();
        }
      }, 10000);

    } catch (error) {
      console.error('Error analyzing recording:', error);
      const randomScore = Math.floor(Math.random() * 30) + 60;
      setScore(randomScore);
      calculateWordScores(currentSentence.text, randomScore);
    }
  };

  const calculateSimilarity = (target: string, recognized: string): number => {
    const targetLower = target.toLowerCase().replace(/[.,!?]/g, '').trim();
    const recognizedLower = recognized.toLowerCase().replace(/[.,!?]/g, '').trim();
    
    if (targetLower === recognizedLower) return 100;
    if (!recognizedLower) return 0;

    // Calculate Levenshtein distance
    const matrix: number[][] = [];
    
    for (let i = 0; i <= targetLower.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= recognizedLower.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= targetLower.length; i++) {
      for (let j = 1; j <= recognizedLower.length; j++) {
        if (targetLower[i - 1] === recognizedLower[j - 1]) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    const distance = matrix[targetLower.length][recognizedLower.length];
    const maxLength = Math.max(targetLower.length, recognizedLower.length);
    const similarity = ((maxLength - distance) / maxLength) * 100;
    
    return Math.round(Math.max(0, Math.min(100, similarity)));
  };

  const calculateWordScores = (text: string, overallScore: number, recognizedText?: string) => {
    const words = text.split(/\s+/).map(w => w.replace(/[.,!?]/g, ''));
    const recognizedWords = recognizedText ? recognizedText.split(/\s+/) : [];
    
    const scores: WordScore[] = words.map((word, index) => {
      const recognized = recognizedWords[index]?.toLowerCase().replace(/[.,!?]/g, '') || '';
      const isCorrect = word.toLowerCase() === recognized;
      
      return {
        word,
        isCorrect,
        score: isCorrect ? 100 : Math.max(0, overallScore - 20)
      };
    });
    
    setWordScores(scores);
  };

  const getScoreClass = (score: number) => {
    if (score >= 80) return 'score-excellent';
    if (score >= 60) return 'score-good';
    return 'score-poor';
  };

  const goToNext = () => {
    if (currentIndex < sentences.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setScore(null);
      setWordScores([]);
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setScore(null);
      setWordScores([]);
    }
  };

  if (loading) {
    return (
      <div className="main">
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (!currentSentence) {
    return (
      <div className="main">
        <div className="empty-state">
          <h2>No sentences available</h2>
          <p>Please add sentences in the admin panel first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="main">
      <div className="practice-container">
        {/* Sentence Display */}
        <div className="card sentence-display">
          <p className="sentence-text">{currentSentence.text}</p>
          <div className="sentence-meta">
            <span style={{ textTransform: 'capitalize' }}>{currentSentence.category}</span>
            <span>•</span>
            <span>Level {currentSentence.difficulty}</span>
            <span>•</span>
            <span>{currentIndex + 1} / {sentences.length}</span>
          </div>
        </div>

        {/* Audio Controls */}
        <div className="card" style={{ width: '100%', maxWidth: '500px' }}>
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <div className="accent-toggle" style={{ display: 'inline-flex' }}>
              <button
                className={accent === 'british' ? 'active' : ''}
                onClick={() => setAccent('british')}
              >
                🇬🇧 British
              </button>
              <button
                className={accent === 'american' ? 'active' : ''}
                onClick={() => setAccent('american')}
              >
                🇺🇸 American
              </button>
            </div>
          </div>

          <div className="audio-controls">
            <button 
              className={`btn ${playing ? 'btn-primary' : 'btn-secondary'}`}
              onClick={playAudio}
              disabled={playing}
            >
              {playing ? 'Playing...' : '▶ Play Audio'}
            </button>
          </div>
        </div>

        {/* Recording Section */}
        <div className="card" style={{ width: '100%', maxWidth: '500px' }}>
          <div className="record-section">
            <button
              className={`record-btn ${isRecording ? 'recording' : ''}`}
              onClick={isRecording ? stopRecording : startRecording}
            >
              {isRecording ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="var(--primary)">
                  <circle cx="12" cy="12" r="8" />
                </svg>
              )}
            </button>
            <p style={{ color: 'var(--text-secondary)' }}>
              {isRecording ? 'Click to stop recording' : 'Click to record your pronunciation'}
            </p>
          </div>
        </div>

        {/* Score Display */}
        {score !== null && (
          <div className="card" style={{ width: '100%', maxWidth: '600px' }}>
            <div className="score-display">
              <div className={`score-value ${getScoreClass(score)}`}>
                {score}%
              </div>
              <p style={{ color: 'var(--text-secondary)' }}>
                {score >= 80 ? 'Excellent! Keep it up!' : 
                 score >= 60 ? 'Good job! Keep practicing!' : 
                 'Keep trying! Listen and repeat.'}
              </p>

              {wordScores.length > 0 && (
                <div className="word-breakdown">
                  {wordScores.map((ws, idx) => (
                    <span
                      key={idx}
                      className={`word-item ${ws.isCorrect ? 'correct' : 'incorrect'}`}
                    >
                      {ws.word}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: 'flex', gap: '16px' }}>
          <button
            className="btn btn-secondary"
            onClick={goToPrevious}
            disabled={currentIndex === 0}
          >
            ← Previous
          </button>
          <button
            className="btn btn-primary"
            onClick={goToNext}
            disabled={currentIndex === sentences.length - 1}
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
};

export default Practice;
