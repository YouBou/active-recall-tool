import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Play, Pencil, Trash2, Code, Type, Image, ListChecks, Eye } from 'lucide-react';
import { useAppContext } from '../store/useAppContext';
import { getDueCards, getMasteryLevel } from '../utils/spaced-repetition';
import type { Card, CardType, MultipleChoiceOption } from '../types';
import { generateId } from '../utils/id';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

const cardTypeLabels: Record<CardType, string> = {
  text: 'テキスト',
  code: 'コード',
  image: '画像',
  'multiple-choice': '選択式',
};

const cardTypeIcons: Record<CardType, typeof Type> = {
  text: Type,
  code: Code,
  image: Image,
  'multiple-choice': ListChecks,
};

const masteryColors: Record<string, string> = {
  new: 'badge-error',
  learning: 'badge-warning',
  reviewing: 'badge-primary',
  mastered: 'badge-success',
};

const masteryLabels: Record<string, string> = {
  new: '新規',
  learning: '学習中',
  reviewing: '復習中',
  mastered: '習得済み',
};

function CardFormModal({ card, deckId, onClose, onSave }: {
  card: Card | null;
  deckId: string;
  onClose: () => void;
  onSave: (card: Card | Omit<Card, 'id' | 'interval' | 'easeFactor' | 'repetitions' | 'nextReview' | 'lastReview' | 'createdAt' | 'updatedAt'>) => void;
}) {
  const [type, setType] = useState<CardType>(card?.type || 'text');
  const [front, setFront] = useState(card?.front || '');
  const [back, setBack] = useState(card?.back || '');
  const [language, setLanguage] = useState(card?.language || 'javascript');
  const [imageUrl, setImageUrl] = useState(card?.imageUrl || '');
  const [options, setOptions] = useState<MultipleChoiceOption[]>(
    card?.options || [
      { id: generateId(), text: '', isCorrect: false },
      { id: generateId(), text: '', isCorrect: false },
    ]
  );
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!front.trim()) return;

    // Validate multiple-choice cards
    if (type === 'multiple-choice') {
      const validOptions = options.filter((o) => o.text.trim());
      if (validOptions.length < 2) {
        setError('選択肢は少なくとも2つ必要です');
        return;
      }
      if (!validOptions.some((o) => o.isCorrect)) {
        setError('少なくとも1つの正解を設定してください');
        return;
      }
    }

    const cardData = {
      ...(card || {}),
      deckId,
      type,
      front: front.trim(),
      back: back.trim(),
      language: type === 'code' ? language : undefined,
      imageUrl: type === 'image' ? imageUrl : undefined,
      options: type === 'multiple-choice' ? options.filter((o) => o.text.trim()) : undefined,
    };
    onSave(cardData as Card);
  };

  const addOption = () => {
    setOptions([...options, { id: generateId(), text: '', isCorrect: false }]);
  };

  const updateOption = (idx: number, text: string) => {
    setOptions(options.map((o, i) => (i === idx ? { ...o, text } : o)));
  };

  const toggleCorrect = (idx: number) => {
    setOptions(options.map((o, i) => (i === idx ? { ...o, isCorrect: !o.isCorrect } : o)));
  };

  const removeOption = (idx: number) => {
    if (options.length > 2) setOptions(options.filter((_, i) => i !== idx));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0 }}>{card ? 'カードを編集' : '新しいカード'}</h3>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowPreview(!showPreview)}>
            <Eye size={14} /> {showPreview ? '編集' : 'プレビュー'}
          </button>
        </div>

        {showPreview ? (
          <div style={{ padding: '16px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', minHeight: '200px' }}>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>質問面</div>
              <div className="markdown-content"><ReactMarkdown>{front || '(未入力)'}</ReactMarkdown></div>
            </div>
            <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '16px 0' }} />
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>解答面</div>
              {type === 'code' ? (
                <SyntaxHighlighter language={language} style={oneDark} customStyle={{ borderRadius: '8px', fontSize: '14px' }}>
                  {back || '(未入力)'}
                </SyntaxHighlighter>
              ) : type === 'multiple-choice' ? (
                <div>
                  {options.filter((o) => o.text).map((o, i) => (
                    <div key={i} className={`mc-option ${o.isCorrect ? 'correct' : ''}`}>
                      <div className="mc-checkbox">{o.isCorrect && '✓'}</div>
                      <span>{o.text}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="markdown-content"><ReactMarkdown>{back || '(未入力)'}</ReactMarkdown></div>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {!card && (
              <div className="tab-group">
                {(['text', 'code', 'image', 'multiple-choice'] as CardType[]).map((t) => {
                  const Icon = cardTypeIcons[t];
                  return (
                    <button key={t} type="button" className={`tab ${type === t ? 'active' : ''}`} onClick={() => { setType(t); setError(''); }}>
                      <Icon size={14} style={{ marginRight: '4px' }} />
                      {cardTypeLabels[t]}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="form-group">
              <label>質問面（マークダウン対応）</label>
              <textarea value={front} onChange={(e) => setFront(e.target.value)} placeholder="質問を入力..." rows={3} autoFocus />
            </div>

            {type === 'image' && (
              <div className="form-group">
                <label>画像URL</label>
                <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://example.com/image.png" />
              </div>
            )}

            {type === 'code' && (
              <div className="form-group">
                <label>プログラミング言語</label>
                <select value={language} onChange={(e) => setLanguage(e.target.value)}>
                  {['javascript', 'typescript', 'python', 'java', 'go', 'rust', 'html', 'css', 'sql', 'bash'].map((lang) => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
              </div>
            )}

            {type === 'multiple-choice' ? (
              <div className="form-group">
                <label>選択肢（正解をチェック）</label>
                {options.map((opt, idx) => (
                  <div key={opt.id} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                    <input
                      type="checkbox"
                      checked={opt.isCorrect}
                      onChange={() => toggleCorrect(idx)}
                      style={{ width: '20px', height: '20px' }}
                    />
                    <input
                      value={opt.text}
                      onChange={(e) => updateOption(idx, e.target.value)}
                      placeholder={`選択肢 ${idx + 1}`}
                      style={{ flex: 1 }}
                    />
                    {options.length > 2 && (
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeOption(idx)}>
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" className="btn btn-secondary btn-sm" onClick={addOption}>
                  <Plus size={14} /> 選択肢を追加
                </button>
              </div>
            ) : (
              <div className="form-group">
                <label>解答面{type === 'code' ? '（コード）' : '（マークダウン対応）'}</label>
                <textarea value={back} onChange={(e) => setBack(e.target.value)} placeholder="解答を入力..." rows={4} style={type === 'code' ? { fontFamily: 'monospace' } : {}} />
              </div>
            )}

            {error && (
              <div style={{ padding: '12px', background: 'var(--error)', color: 'white', borderRadius: 'var(--radius-sm)', marginTop: '16px', fontSize: '14px' }}>
                {error}
              </div>
            )}

            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={onClose}>キャンセル</button>
              <button type="submit" className="btn btn-primary">{card ? '更新' : '作成'}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function DeckDetailPage() {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();
  const { data, addCard, updateCard, deleteCard } = useAppContext();
  const [showModal, setShowModal] = useState(false);
  const [editingCard, setEditingCard] = useState<Card | null>(null);

  const deck = data.decks.find((d) => d.id === deckId);
  const cards = useMemo(() => data.cards.filter((c) => c.deckId === deckId), [data.cards, deckId]);
  const dueCount = deckId ? getDueCards(data.cards, deckId).length : 0;

  if (!deck) {
    return (
      <div className="empty-state">
        <p>デッキが見つかりません</p>
        <button className="btn btn-primary" onClick={() => navigate('/')}>戻る</button>
      </div>
    );
  }

  const handleSave = (cardData: Card | Omit<Card, 'id' | 'interval' | 'easeFactor' | 'repetitions' | 'nextReview' | 'lastReview' | 'createdAt' | 'updatedAt'>) => {
    if ('id' in cardData && cardData.id) {
      updateCard(cardData as Card);
    } else {
      addCard(cardData);
    }
    setShowModal(false);
    setEditingCard(null);
  };

  return (
    <>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="btn btn-ghost btn-icon" onClick={() => navigate('/')}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2>{deck.name}</h2>
            {deck.description && <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{deck.description}</p>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {dueCount > 0 && (
            <button className="btn btn-primary" onClick={() => navigate(`/study/${deck.id}`)}>
              <Play size={18} /> {dueCount}枚を学習
            </button>
          )}
          <button className="btn btn-secondary" onClick={() => { setEditingCard(null); setShowModal(true); }}>
            <Plus size={18} /> カード追加
          </button>
        </div>
      </div>

      {cards.length === 0 ? (
        <div className="empty-state">
          <Type size={48} />
          <p>カードがまだありません</p>
          <button className="btn btn-primary" onClick={() => { setEditingCard(null); setShowModal(true); }}>
            <Plus size={18} /> 最初のカードを作成
          </button>
        </div>
      ) : (
        <div>
          {cards.map((card) => {
            const mastery = getMasteryLevel(card);
            const Icon = cardTypeIcons[card.type];
            return (
              <div key={card.id} className="card-list-item">
                <div className="card-info">
                  <div className="card-front">{card.front}</div>
                  <div className="card-meta">
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Icon size={12} /> {cardTypeLabels[card.type]}
                    </span>
                    <span className={`badge ${masteryColors[mastery]}`}>{masteryLabels[mastery]}</span>
                    <span>間隔: {card.interval}日</span>
                  </div>
                </div>
                <div className="card-actions">
                  <button className="btn btn-ghost btn-icon btn-sm" onClick={() => { setEditingCard(card); setShowModal(true); }}>
                    <Pencil size={14} />
                  </button>
                  <button className="btn btn-ghost btn-icon btn-sm" onClick={() => { if (confirm('このカードを削除しますか？')) deleteCard(card.id); }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <CardFormModal
          card={editingCard}
          deckId={deck.id}
          onClose={() => { setShowModal(false); setEditingCard(null); }}
          onSave={handleSave}
        />
      )}
    </>
  );
}
