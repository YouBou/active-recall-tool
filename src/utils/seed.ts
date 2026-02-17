import type { AppData } from '../types';
import { generateId } from './id';

export function generateSeedData(): AppData {
  const now = new Date().toISOString();

  const deck1Id = generateId();
  const deck2Id = generateId();
  const deck3Id = generateId();

  const makeCard = (
    deckId: string,
    front: string,
    back: string,
    type: 'text' | 'code' | 'image' | 'multiple-choice' = 'text',
    extra: Record<string, unknown> = {}
  ) => ({
    id: generateId(),
    deckId,
    type,
    front,
    back,
    interval: 1,
    easeFactor: 2.5,
    repetitions: 0,
    nextReview: now,
    lastReview: null,
    createdAt: now,
    updatedAt: now,
    ...extra,
  });

  return {
    decks: [
      { id: deck1Id, name: 'JavaScript基礎', description: 'JavaScriptの基本概念', category: 'プログラミング', createdAt: now, updatedAt: now },
      { id: deck2Id, name: 'React入門', description: 'Reactの基礎知識', category: 'プログラミング', createdAt: now, updatedAt: now },
      { id: deck3Id, name: '英単語', description: 'TOEIC頻出単語', category: '語学', createdAt: now, updatedAt: now },
    ],
    cards: [
      makeCard(deck1Id, 'クロージャとは何ですか？', 'クロージャとは、関数とその関数が宣言されたレキシカル環境の組み合わせです。内側の関数から外側の関数のスコープにアクセスできます。'),
      makeCard(deck1Id, '`var`と`let`の違いは？', '`var`は関数スコープ、`let`はブロックスコープです。`let`はホイスティングされますが初期化前にアクセスするとReferenceErrorになります。'),
      makeCard(deck1Id, '以下のコードの出力は？', '`undefined`が出力されます。`var`はホイスティングされますが、値の代入は実行時に行われます。', 'code', { language: 'javascript', back: '```\nconsole.log(x); // undefined\nvar x = 5;\n```\n`var`はホイスティングされますが値の代入は実行時です。' }),
      makeCard(deck2Id, 'useEffectの第2引数に空配列を渡すとどうなりますか？', 'コンポーネントのマウント時に1回だけ実行されます。アンマウント時にクリーンアップ関数が呼ばれます。'),
      makeCard(deck2Id, 'Reactで状態管理に使われるフックは？', 'useState, useReducer, useContext など', 'multiple-choice', {
        options: [
          { id: generateId(), text: 'useState', isCorrect: true },
          { id: generateId(), text: 'useEffect', isCorrect: false },
          { id: generateId(), text: 'useReducer', isCorrect: true },
          { id: generateId(), text: 'useRef', isCorrect: false },
        ],
      }),
      makeCard(deck3Id, 'inevitable', '避けられない、必然的な'),
      makeCard(deck3Id, 'comprehensive', '包括的な、総合的な'),
      makeCard(deck3Id, 'elaborate', '精巧な、手の込んだ / 詳しく述べる'),
    ],
    sessions: [],
  };
}
