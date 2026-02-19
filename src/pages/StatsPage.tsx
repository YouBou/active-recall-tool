import { useMemo } from 'react';
import { useAppContext } from '../store/useAppContext';
import { getMasteryLevel } from '../utils/spaced-repetition';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download, Upload } from 'lucide-react';
import { exportData, importData, bulkInsertSeedData } from '../utils/storage';
import { useAuth } from '../store/useAuth';

const MASTERY_COLORS = {
  new: '#ef4444',
  learning: '#eab308',
  reviewing: '#3b82f6',
  mastered: '#22c55e',
};

const MASTERY_LABELS: Record<string, string> = {
  new: '新規',
  learning: '学習中',
  reviewing: '復習中',
  mastered: '習得済み',
};

export default function StatsPage() {
  const { data, setData } = useAppContext();
  const { user } = useAuth();

  const totalCards = data.cards.length;
  const totalDecks = data.decks.length;

  // Mastery distribution
  const masteryData = useMemo(() => {
    const counts: Record<string, number> = { new: 0, learning: 0, reviewing: 0, mastered: 0 };
    data.cards.forEach((c) => {
      counts[getMasteryLevel(c)]++;
    });
    return Object.entries(counts).map(([key, value]) => ({
      name: MASTERY_LABELS[key],
      value,
      color: MASTERY_COLORS[key as keyof typeof MASTERY_COLORS],
    }));
  }, [data.cards]);

  const toDateKey = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  // Daily study data (last 7 days)
  const dailyData = useMemo(() => {
    const days: { date: string; cards: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = toDateKey(d);
      const label = `${d.getMonth() + 1}/${d.getDate()}`;
      const sessionsOnDay = data.sessions.filter((s) => toDateKey(new Date(s.startedAt)) === dateStr);
      const cardsStudied = sessionsOnDay.reduce((sum, s) => sum + s.cardsStudied, 0);
      days.push({ date: label, cards: cardsStudied });
    }
    return days;
  }, [data.sessions]);

  // Streak calculation
  const streak = useMemo(() => {
    let count = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = toDateKey(d);
      const hasSession = data.sessions.some((s) => toDateKey(new Date(s.startedAt)) === dateStr);
      if (hasSession) {
        count++;
      } else if (i > 0) {
        break;
      }
    }
    return count;
  }, [data.sessions]);

  // Deck progress
  const deckProgress = useMemo(() => {
    return data.decks.map((deck) => {
      const cards = data.cards.filter((c) => c.deckId === deck.id);
      const mastered = cards.filter((c) => getMasteryLevel(c) === 'mastered').length;
      return {
        name: deck.name,
        total: cards.length,
        mastered,
        progress: cards.length > 0 ? Math.round((mastered / cards.length) * 100) : 0,
      };
    });
  }, [data.decks, data.cards]);

  // Total sessions
  const totalSessions = data.sessions.length;
  const totalCardsStudied = data.sessions.reduce((sum, s) => sum + s.cardsStudied, 0);

  const handleExport = () => {
    const json = exportData(data);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `active-recall-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const imported = importData(ev.target?.result as string);
          setData(imported);
          if (user) {
            bulkInsertSeedData(imported, user.id).catch(() => {
              alert('データの保存に失敗しました。再度インポートしてください。');
            });
          }
        } catch {
          alert('無効なファイル形式です');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <>
      <div className="page-header">
        <h2>統計</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary" onClick={handleExport}>
            <Download size={16} /> エクスポート
          </button>
          <button className="btn btn-secondary" onClick={handleImport}>
            <Upload size={16} /> インポート
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{totalDecks}</div>
          <div className="stat-label">デッキ数</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{totalCards}</div>
          <div className="stat-label">カード数</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{totalCardsStudied}</div>
          <div className="stat-label">総学習カード数</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{streak}</div>
          <div className="stat-label">連続学習日数</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '16px' }}>
        <h3 style={{ marginBottom: '16px' }}>日別学習カード数（直近7日）</h3>
        {totalSessions === 0 ? (
          <div className="empty-state" style={{ padding: '24px' }}>
            <p>まだ学習データがありません</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={12} />
              <YAxis stroke="var(--text-secondary)" fontSize={12} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  color: 'var(--text)',
                }}
              />
              <Bar dataKey="cards" fill="var(--primary)" radius={[4, 4, 0, 0]} name="学習カード数" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px', marginBottom: '16px' }}>
        <div className="card">
          <h3 style={{ marginBottom: '16px' }}>カード習熟度分布</h3>
          {totalCards === 0 ? (
            <div className="empty-state" style={{ padding: '24px' }}><p>カードがありません</p></div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={masteryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {masteryData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '16px' }}>デッキ別進捗</h3>
          {deckProgress.length === 0 ? (
            <div className="empty-state" style={{ padding: '24px' }}><p>デッキがありません</p></div>
          ) : (
            <div>
              {deckProgress.map((dp) => (
                <div key={dp.name} style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '14px' }}>
                    <span>{dp.name}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{dp.mastered}/{dp.total} 習得 ({dp.progress}%)</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-bar-fill" style={{ width: `${dp.progress}%`, background: 'var(--success)' }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
