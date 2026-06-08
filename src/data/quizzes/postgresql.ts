import type { QuizQuestion } from '../../types';

export const postgresql: QuizQuestion[] = [
  {
    id: 'pg-isolation-001',
    category: 'postgresql',
    subcategory: 'isolation-levels',
    difficulty: 'core',
    question: 'Under PostgreSQL READ COMMITTED, which anomaly is still possible?',
    options: [
      'Dirty reads',
      'Non-repeatable reads',
      'Reading uncommitted data from other transactions',
      'Nothing — it is fully serializable',
    ],
    correctIndex: 1,
    explanation:
      'READ COMMITTED (the Postgres default) prevents dirty reads, so you never see another transaction\'s uncommitted changes. However each statement sees a fresh snapshot, so re-reading the same row can return different values if another transaction committed in between — a non-repeatable read. To prevent that you need REPEATABLE READ, and SERIALIZABLE to also prevent phantoms and write skew.',
    interviewTip: 'Default is READ COMMITTED; jump to SERIALIZABLE only when write skew matters.',
  },
  {
    id: 'pg-nplus1-001',
    category: 'postgresql',
    subcategory: 'n-plus-1',
    difficulty: 'core',
    question: 'An ORM loads 100 orders then lazily loads each order\'s customer. What is the problem and fix?',
    options: [
      'No problem — lazy loading is always optimal',
      'N+1 queries; fix with a JOIN or an eager/batched relation load',
      'Too much memory; fix by adding an index',
      'A deadlock; fix by lowering the isolation level',
    ],
    correctIndex: 1,
    explanation:
      'This is the classic N+1 problem: 1 query for the orders plus 1 query per order for its customer, so 101 round trips. The fix is to fetch the related rows in a single query (a JOIN, or the ORM\'s eager/relations loading, or a batched IN query). Watch your query logs in development — N+1 is invisible until you count the statements.',
    interviewTip: 'Always say you watch the SQL log to catch N+1 early.',
  },
  {
    id: 'pg-money-001',
    category: 'postgresql',
    subcategory: 'data-types',
    difficulty: 'foundation',
    question: 'Which type should store monetary amounts in a fintech database?',
    options: [
      'double precision (float8)',
      'real (float4)',
      'numeric/decimal with a fixed scale',
      'text, formatted as currency',
    ],
    correctIndex: 2,
    explanation:
      'Floating point cannot represent values like 0.10 exactly, so sums drift and reconciliations fail — unacceptable for money. Use numeric/decimal with an explicit precision and scale (or store integer minor units like cents). The trade-off is that numeric math is slower than float, but correctness wins for currency.',
    interviewTip: 'Say numeric(precision, scale) or integer cents — never float for money.',
  },
  {
    id: 'pg-index-gin-001',
    category: 'postgresql',
    subcategory: 'indexes',
    difficulty: 'expert',
    question: 'You frequently filter rows by keys inside a JSONB column. Which index helps most?',
    options: [
      'A B-tree index on the whole JSONB column',
      'A GIN index on the JSONB column',
      'A hash index on the table primary key',
      'No index can help JSONB queries',
    ],
    correctIndex: 1,
    explanation:
      'GIN (Generalized Inverted Index) is built for containment and key/element lookups, which is exactly how JSONB and arrays are queried (the @> operator, key existence, etc.). A plain B-tree only helps equality/range on a scalar value, not membership inside a document. The trade-off is that GIN indexes are larger and slower to update, so index only the access patterns you actually run.',
  },
];
