import { useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import { useAppContext } from '../store/AppContext';
import { getDueCards } from '../utils/spaced-repetition';
import type { Card, Rating, StudySession } from '../types';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

function CardContent({ card, showAnswer }: { card: Card; showAnswer: boolean }) {
  if (!showAnswer) {
    return (
      <div className="flashcard-content">
        <div className="markdown-content">
          <ReactMarkdown>{card.front}</ReactMarkdown>
        </div>
        {card.type === 'image' && card.imageUrl && (
          <img src={card.imageUrl} alt="card" style={{ maxWidth: '100%', marginTop: '16px', borderRadius: '8px' }} />
        )}
      </div>
    );
  }

  if (card.type === 'code') {
    return (
      <div className="flashcard-content">
        <div className="markdown-content">
          <ReactMarkdown
            components={{
              code({ className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '');
                const lang = match ? match[1] : card.language || 'text';
                if (className || card.language) {
                  return (
                    <SyntaxHighlighter language={lang} style={oneDark} customStyle={{ borderRadius: '8px', fontSize: '14px' }}>
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  );
                }
                return <code className={className} {...props}>{children}</code>;
              },
            }}
          >
            {card.back}
          </ReactMarkdown>
        </div>
      </div>
    );
  }

  if (card.type === 'multiple-choice' && card.options) {
    return (
      <div className="flashcard-content" style={{ textAlign: 'left' }}>
        <div className="markdown-content" style={{ marginBottom: '16px' }}>
          <ReactMarkdown>{card.back || '正解:'}</ReactMarkdown>
        </div>
        {card.options.map((opt) => (
          <div key={opt.id} className={`mc-option ${opt.isCorrect ? 'correct' : ''}`}>
            <div className="mc-checkbox">{opt.isCorrect && <Check size={14} />}</div>
            <span>{opt.text}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flashcard-content">
      <div className="markdown-content">
        <ReactMarkdown>{card.back}</ReactMarkdown>
      </div>
    </div>
  );
}

export default function StudyPage() {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();
  const { data, rateCard, startSession, endSession } = useAppContext();

  const deck = data.decks.find((d) => d.id === deckId);
  const dueCards = useMemo(() => (deckId ? getDueCards(data.cards, deckId) : []), [data.cards, deckId]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [session, setSession] = useState<StudySession | null>(null);
  const [studiedIds, setStudiedIds] = useState<Set<string>>(new Set());
  const [ratings, setRatings] = useState({ forgot: 0, hard: 0, good: 0 });

  const totalCards = dueCards.length;
  const currentCard: Card | undefined = dueCards[currentIndex];
  const isComplete = currentIndex >= totalCards;

  // Start session on first render
  if (!session && deckId && totalCards > 0) {
    const s = startSession(deckId);
    setSession(s);
  }

  const handleRate = useCallback((rating: Rating) => {
    if (!currentCard) return;

    rateCard(currentCard.id, rating);
    setStudiedIds((prev) => new Set(prev).add(currentCard.id));
    setRatings((prev) => ({ ...prev, [rating]: prev[rating] + 1 }));
    setFlipped(false);

    const nextIndex = currentIndex + 1;
    setCurrentIndex(nextIndex);

    if (nextIndex >= totalCards && session) {
      endSession({
        ...session,
        cardsStudied: studiedIds.size + 1,
        ratings: { ...ratings, [rating]: ratings[rating] + 1 },
      });
    }
  }, [currentCard, currentIndex, totalCards, session, studiedIds, ratings, rateCard, endSession]);

  if (!deck) {
    return (
      <div className="empty-state">
        <p>デッキが見つかりません</p>
        <button className="btn btn-primary" onClick={() => navigate('/')}>戻る</button>
      </div>
    );
  }

  if (totalCards === 0) {
    return (
      <div className="empty-state">
        <p>復習するカードがありません</p>
        <button className="btn btn-primary" onClick={() => navigate(`/deck/${deckId}`)}>デッキに戻る</button>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="study-complete">
        <h2>学習完了！</h2>
        <p style={{ color: 'var(--text-secondary)' }}>{deck.name}の復習が完了しました</p>
        <div className="results">
          <div className="result-item">
            <div className="result-value" style={{ color: 'var(--error)' }}>{ratings.forgot}</div>
            <div className="result-label">忘れた</div>
          </div>
          <div className="result-item">
            <div className="result-value" style={{ color: 'var(--warning)' }}>{ratings.hard}</div>
            <div className="result-label">難しい</div>
          </div>
          <div className="result-item">
            <div className="result-value" style={{ color: 'var(--success)' }}>{ratings.good}</div>
            <div className="result-label">覚えた</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button className="btn btn-secondary btn-lg" onClick={() => navigate(`/deck/${deckId}`)}>デッキに戻る</button>
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/')}>ホームへ</button>
        </div>
      </div>
    );
  }

  const progress = ((currentIndex) / totalCards) * 100;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <button className="btn btn-ghost" onClick={() => navigate(`/deck/${deckId}`)}>
          <ArrowLeft size={18} /> やめる
        </button>
        <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          {currentIndex + 1} / {totalCards}
        </span>
      </div>

      <div className="progress-bar" style={{ marginBottom: '24px' }}>
        <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
      </div>

      <div className="flashcard-container">
        <div className={`flashcard ${flipped ? 'flipped' : ''}`} onClick={() => !flipped && setFlipped(true)}>
          <div className="flashcard-face">
            <div className="flashcard-label">質問</div>
            <CardContent card={currentCard} showAnswer={false} />
          </div>
          <div className="flashcard-face flashcard-back">
            <div className="flashcard-label">解答</div>
            <CardContent card={currentCard} showAnswer={true} />
          </div>
        </div>
      </div>

      {!flipped ? (
        <div style={{ textAlign: 'center', marginTop: '24px', color: 'var(--text-tertiary)' }}>
          タップして解答を表示
        </div>
      ) : (
        <div className="rating-buttons">
          <button className="rating-btn forgot" onClick={() => handleRate('forgot')}>
            忘れた
          </button>
          <button className="rating-btn hard" onClick={() => handleRate('hard')}>
            難しい
          </button>
          <button className="rating-btn good" onClick={() => handleRate('good')}>
            覚えた
          </button>
        </div>
      )}
    </div>
  );
}
