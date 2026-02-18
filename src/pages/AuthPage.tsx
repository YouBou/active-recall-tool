import { useState } from 'react';
import { Brain } from 'lucide-react';
import { useAuth } from '../store/useAuth';

export default function AuthPage() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    if (mode === 'login') {
      const { error: err } = await signIn(email, password);
      if (err) setError(err);
    } else {
      const { error: err, emailSent: sent } = await signUp(email, password);
      if (err) setError(err);
      else if (sent) setEmailSent(true);
    }

    setIsSubmitting(false);
  };

  const switchMode = () => {
    setMode((m) => (m === 'login' ? 'signup' : 'login'));
    setError(null);
    setEmailSent(false);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
            <Brain size={32} color="var(--primary)" />
            <span style={{ fontSize: '24px', fontWeight: 700 }}>Active Recall</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            間隔反復フラッシュカードで効率的に学習
          </p>
        </div>

        {emailSent ? (
          <div style={{ textAlign: 'center' }}>
            <p style={{ marginBottom: '8px', fontWeight: 600 }}>確認メールを送信しました</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
              {email} に届いたリンクをクリックしてアカウントを有効化してください。
            </p>
            <button className="btn btn-secondary" onClick={switchMode}>
              ログイン画面へ
            </button>
          </div>
        ) : (
          <>
            <h2 style={{ marginBottom: '24px', textAlign: 'center' }}>
              {mode === 'login' ? 'ログイン' : 'アカウント作成'}
            </h2>

            <form onSubmit={(e) => void handleSubmit(e)}>
              <div className="form-group">
                <label className="form-label">メールアドレス</label>
                <input
                  type="email"
                  className="form-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                />
              </div>

              <div className="form-group">
                <label className="form-label">パスワード</label>
                <input
                  type="password"
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  placeholder="6文字以上"
                  minLength={6}
                />
              </div>

              {error && (
                <p style={{ color: 'var(--error)', fontSize: '14px', marginBottom: '16px' }}>{error}</p>
              )}

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={isSubmitting}>
                {isSubmitting ? '処理中...' : mode === 'login' ? 'ログイン' : 'アカウント作成'}
              </button>
            </form>

            <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '14px', color: 'var(--text-secondary)' }}>
              {mode === 'login' ? 'アカウントをお持ちでない方は' : 'すでにアカウントをお持ちの方は'}
              {' '}
              <button
                type="button"
                onClick={switchMode}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: 0, fontSize: '14px' }}
              >
                {mode === 'login' ? 'こちらから登録' : 'ログイン'}
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
