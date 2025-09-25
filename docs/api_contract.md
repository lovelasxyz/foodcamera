# API Contract (MVP Draft)

> Status: Draft for backend implementation alignment.

## Environment & Flags
- BASE_URL: `VITE_API_BASE_URL` (fallback legacy `VITE_SPIN_API_URL`)
- Feature flags:
  - `VITE_USE_API` toggles real API usage.
  - `VITE_USE_MOCKS` forces mocks even if API available.
  - Legacy: `VITE_FORCE_LOCAL_SPIN` bypasses spin HTTP.

## Common Conventions
- JSON body; `Content-Type: application/json`.
- Auth: `Authorization: Bearer <token>`.
- Tracing: client sends `X-Request-Id` header (uuid v4 or fallback `req-<ts>-<rand>`).
- Error envelope shape (client parses):
```json
{ "error": { "code": "<string|number>", "message": "Human readable", "details": {"...": "optional"} } }
```
- Success responses return raw object (no envelope) for now.

## Auth
### POST /auth/telegram
Request:
```json
{ "initData": "<telegram init data string>" }
```
Response:
```json
{ "token": "jwt", "expiresIn": 3600, "refreshToken": "<opaque>" }
```
Notes:
- Client stores token + expiry + refreshToken.
- Silent refresh planned ~60s before expiry.

### POST /auth/refresh
Request:
```json
{ "refreshToken": "<opaque>" }
```
Response: same as /auth/telegram.
Errors:
- 401 + error envelope on invalid/expired refresh.

## User
### GET /user/me
Response (subset):
```json
{
  "id":"u123",
  "balance":123.45,
  "stats": {"spinsCount": 42, "lastAuthAt": 1712345678901},
  "inventory": [ {"id":"inv1","prizeId":10,"status":"active"} ],
  "perks": {"freeSpins": false}
}
```

## Spin
### POST /spin
Request (MVP):
```json
{ "caseId": 101, "requestId": "req-uuid", "mode": "normal" }
```
Response:
```json
{
  "spinId": "spin-uuid",
  "caseId": 101,
  "prize": { "id": 55, "name": "Diamond", "price": 10, "rarity": "epic", "image": "/p/55.png" },
  "position": 7,
  "timestamp": 1712345678000,
  "balanceDelta": -5, // optional
  "userPatch": { "balance": 118.45, "stats": { "spinsCount": 43 } }
}
```
Behavior:
- If `userPatch.balance` returned, client does NOT perform local debit beforehand (authoritative mode).
- If absent, client debits locally and still applies prize.
- `requestId` used for idempotency / correlation.

## Deposits
### POST /billing/deposit
Request:
```json
{ "amount": 50, "currency": "USDT", "clientDepositId": "dep-uuid" }
```
Response (pending):
```json
{ "id": "d-uuid", "amount":50, "currency":"USDT", "status":"pending", "createdAt": 1712345678000, "updatedAt": 1712345678000 }
```
Lifecycle:
1. Client creates pending deposit (no balance credit yet).
2. Server later marks confirmed (webhook + poll endpoint TBD) — then client credits.
3. If failure -> `status":"failed"` and no credit.
Idempotency:
- Same `clientDepositId` must return existing deposit (exact match) without duplication.

## Cases (Catalog)
### GET /cases
Response:
```json
[
  {
    "id": 1,
    "name": "Starter Case",
    "price": 5,
    "image": "/cases/1.png",
    "isActive": true,
    "prizes": [ { "id": 55, "name": "Diamond", "price": 10, "rarity": "epic", "image": "/p/55.png", "weight": 120 } ],
    "updatedAt": 1712345678000
  }
]
```

### GET /cases/{id}
Response: single `ApiCase` object like above.

Notes:
- `weight` optional and informational for transparency; frontend currently does not require it for spin logic (server authoritative).
- Inactive cases should be excluded from public list (or include `isActive` and let client filter).

## Banners
### GET /banners
Returns active banners in priority order (descending) and filtered by time window if `startsAt` / `endsAt` present.
```json
[
  { "id":1, "title":"Invite friends and earn", "image":"/banners/invite.png", "priority":10, "link":"https://t.me/xxx", "isActive":true },
  { "id":2, "title":"New Epic Case Released", "image":"/banners/epic.png", "priority":8, "isActive":true }
]
```
Fields:
- `priority` higher first
- `startsAt` / `endsAt` (epoch ms) optional. If missing -> always valid while `isActive`.
- `link` optional; client opens in Telegram or external.

Admin CRUD (future via Telegram bot): create/update/deactivate banners, adjust priority.

## Products (Store / Boosters)
### GET /products
Response:
```json
[
  {
    "id": 101,
    "sku": "boost_x2",
    "name": "x2 Shard Booster",
    "description": "Doubles shard gain for 1 hour",
    "image": "/products/boost_x2.png",
    "price": 5,
    "currency": "USDT",
    "category": "boost",
    "benefits": { "multiplier": 2, "durationMinutes": 60 },
    "isActive": true,
    "updatedAt": 1712345678000
  }
]
```
Notes:
- `sku` стабильный ключ для внутриигровых ссылок.
- `benefits` свободная JSON структура (бот и сервер знают семантику).
- Редактирование и выпуск новых продуктов осуществляется через Telegram бот (admin flow).

## Inventory
(Placeholder) `GET /inventory` envisioned to hydrate authoritative inventory; current client merges without duplicates.

## Error Examples
Spin insufficient balance:
```json
{ "error": { "code": "INSUFFICIENT_FUNDS", "message": "Balance too low" } }
```
Expired token:
```json
{ "error": { "code": 401, "message": "Session expired" } }
```

## Future Extensions
- Add `X-Session-Version` for optimistic concurrency on user state.
- WebSocket channel for real-time spin confirmations or jackpots.
- Structured metrics/tracing IDs (`traceparent`) once backend observability stack ready.

## Open Questions for Backend
| Topic | Decision Needed |
|-------|-----------------|
| Spin idempotency window | TTL / replay handling |
| Deposit confirmation fetch | Poll endpoint path & shape |
| Prize mutation authority | Can backend rename/price adjust dynamically? |
| Refresh token rotation | Rotating vs static refresh token policy |
| Stats increment semantics | Partial increments vs full recomputed patch |

---
This document will evolve; keep changes minimal & backward-compatible.
