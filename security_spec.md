# Firestore Security Specification — Karachi Brasserie

## 1. Data Invariants
1. A `UserProfile` at `/users/{userId}` can only be read, created, or updated by the verified authenticated user whose `request.auth.uid == userId`. PII (`email`, `phone`, `defaultAddress`) is strictly private to the owner.
2. A `FavoriteItem` at `/users/{userId}/favorites/{itemId}` belongs exclusively to `userId` and requires parent profile existence or verified owner match (`request.auth.uid == userId`).
3. An `Order` at `/orders/{orderId}` must be created by an authenticated, email-verified user with `userId == request.auth.uid`, initial `status == 'confirmed'`, non-negative financial totals (`subtotal > 0`, `deliveryFee >= 0`, `total == subtotal + deliveryFee`), and bounded `items` array (`1 <= items.size() <= 50`).
4. List queries on `/orders` enforce `resource.data.userId == request.auth.uid` at the rule level so no user can scrape another customer's orders.
5. Terminal order status (`completed`) locks further client edits; immutable fields (`orderId`, `userId`, `createdAt`, `subtotal`, `deliveryFee`, `total`) cannot be altered after creation.

## 2. Adversarial Test Vectors ("Dirty Dozen")
1. Unauthenticated read of `/users/u1` -> `PERMISSION_DENIED`
2. Cross-user read of `/users/u2` by `u1` -> `PERMISSION_DENIED`
3. Unverified email (`email_verified: false`) attempting `/users/u1` create -> `PERMISSION_DENIED`
4. Shadow field injection (`isAdmin: true`) on `/users/u1` create -> `PERMISSION_DENIED`
5. Client-forged timestamp (`createdAt != request.time`) on `/users/u1` -> `PERMISSION_DENIED`
6. Oversized `defaultAddress` (> 300 chars) on `/users/u1` -> `PERMISSION_DENIED`
7. Unscoped list query on `/orders` without `where('userId', '==', uid)` -> `PERMISSION_DENIED`
8. Order creation with forged `userId != request.auth.uid` -> `PERMISSION_DENIED`
9. Order creation with skipped status (`status: 'completed'`) -> `PERMISSION_DENIED`
10. Order creation with tampered `total != subtotal + deliveryFee` -> `PERMISSION_DENIED`
11. Order update attempting to mutate `total` or `userId` -> `PERMISSION_DENIED`
12. Malformed document ID (`../badId` or >128 chars) -> `PERMISSION_DENIED`
