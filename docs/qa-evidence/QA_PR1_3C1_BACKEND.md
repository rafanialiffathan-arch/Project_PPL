\# QA PR #1 — Sprint 3C.1 Backend Status-Aware



Branch: review/pr-1  

PR: #1 feature/3c1-transaction-status-aware  

Tester: Ariq  

Date: 2026-06-26



\## Environment

\- Backend: npm run dev

\- Database: accountech\_db

\- Login user: admin\_utama

\- Role: admin\_sistem

\- Typecheck: npx tsc --noEmit PASS



\## Test Result



| No | Scenario | Expected | Result |

|---|---|---|---|

| 1 | Login admin\_utama | Token returned | PASS |

| 2 | GET /api/transaksi/summary | official/monthly/by\_category/pending/rejected returned | PASS |

| 3 | Summary official totals | income 665000, expense 0, net 665000, count 3 | PASS |

| 4 | GET /api/transaksi?status=approved | Return approved + valid only | PASS |

| 5 | GET /api/transaksi?status=xyz | 400 | PASS |

| 6 | GET /api/transaksi?start\_date=salah | 400 | PASS |

| 7 | GET start\_date > end\_date | 400 | PASS |

| 8 | DELETE approved transaction id=14 | 400 | PASS |

| 9 | PUT approved transaction id=14 | 400 | PASS |

| 10 | PUT pending transaction id=13 | success | PASS |

| 11 | User without permission | 403 | SKIPPED — no demo account without view\_pembukuan available |



\## Summary Output



official:

\- income: 665000

\- expense: 0

\- net: 665000

\- count: 3



pending:

\- count: 4



rejected:

\- count: 3



\## Conclusion



PR #1 backend Sprint 3C.1 passes core QA and is safe to merge into dev for integration testing.

