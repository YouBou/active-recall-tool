import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Play, Pencil, Trash2 } from 'lucide-react';
import { useAppContext } from '../store/AppContext';
import { getDueCards } from '../utils/spaced-repetition';
import type { Deck } from '../types';

function DeckModal({ deck, onClose, onSave }: {
  deck: Deck | null;
  onClose: () => void;
  onSave: (name: string, description: string, category: string) => void;
}) {
  const [name, setName] = useState(deck?.name || '');
  const [description, setDescription] = useState(deck?.description || '');
  const [category, setCategory] = useState(deck?.category || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(name.trim(), description.trim(), category.trim());
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{deck ? 'デッキを編集' : '新しいデッキ'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>デッキ名</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="例: JavaScript基礎" autoFocus />
          </div>
          <div className="form-group">
            <label>説明</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="デッキの説明（任意）" rows={3} />
          </div>
          <div className="form-group">
            <label>カテゴリ</label>
            <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="例: プログラミング" />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>キャンセル</button>
            <button type="submit" className="btn btn-primary">{deck ? '更新' : '作成'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function DecksPage() {
  const { data, addDeck, updateDeck, deleteDeck } = useAppContext();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [editingDeck, setEditingDeck] = useState<Deck | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const categories = useMemo(() => {
    const cats = new Set(data.decks.map((d) => d.category).filter(Boolean));
    return Array.from(cats);
  }, [data.decks]);

  const filteredDecks = useMemo(() => {
    if (!selectedCategory) return data.decks;
    return data.decks.filter((d) => d.category === selectedCategory);
  }, [data.decks, selectedCategory]);

  const handleSave = (name: string, description: string, category: string) => {
    if (editingDeck) {
      updateDeck({ ...editingDeck, name, description, category });
    } else {
      addDeck(name, description, category);
    }
    setShowModal(false);
    setEditingDeck(null);
  };

  const handleDelete = (e: React.MouseEvent, deckId: string) => {
    e.stopPropagation();
    if (confirm('このデッキとすべてのカードを削除しますか？')) {
      deleteDeck(deckId);
    }
  };

  const handleEdit = (e: React.MouseEvent, deck: Deck) => {
    e.stopPropagation();
    setEditingDeck(deck);
    setShowModal(true);
  };

  const handleStudy = (e: React.MouseEvent, deckId: string) => {
    e.stopPropagation();
    navigate(`/study/${deckId}`);
  };

  return (
    <>
      <div className="page-header">
        <h2>デッキ一覧</h2>
        <button className="btn btn-primary" onClick={() => { setEditingDeck(null); setShowModal(true); }}>
          <Plus size={18} /> 新しいデッキ
        </button>
      </div>

      {categories.length > 0 && (
        <div className="category-filters">
          <button
            className={`category-chip ${!selectedCategory ? 'active' : ''}`}
            onClick={() => setSelectedCategory('')}
          >
            すべて
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              className={`category-chip ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {filteredDecks.length === 0 ? (
        <div className="empty-state">
          <Layers size={48} />
          <p>デッキがまだありません</p>
          <button className="btn btn-primary" onClick={() => { setEditingDeck(null); setShowModal(true); }}>
            <Plus size={18} /> 最初のデッキを作成
          </button>
        </div>
      ) : (
        <div className="card-grid">
          {filteredDecks.map((deck) => {
            const cardCount = data.cards.filter((c) => c.deckId === deck.id).length;
            const dueCount = getDueCards(data.cards, deck.id).length;
            return (
              <div key={deck.id} className="card deck-card" onClick={() => navigate(`/deck/${deck.id}`)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div className="deck-name">{deck.name}</div>
                    {deck.category && <span className="badge badge-primary">{deck.category}</span>}
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={(e) => handleEdit(e, deck)}>
                      <Pencil size={14} />
                    </button>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={(e) => handleDelete(e, deck.id)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                {deck.description && <div className="deck-desc">{deck.description}</div>}
                <div className="deck-stats">
                  <span>{cardCount} カード</span>
                  {dueCount > 0 ? (
                    <button className="btn btn-primary btn-sm" onClick={(e) => handleStudy(e, deck.id)}>
                      <Play size={14} /> {dueCount}枚を学習
                    </button>
                  ) : (
                    <span className="deck-due">復習完了</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <DeckModal
          deck={editingDeck}
          onClose={() => { setShowModal(false); setEditingDeck(null); }}
          onSave={handleSave}
        />
      )}
    </>
  );
}
