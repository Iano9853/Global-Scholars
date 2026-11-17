# Security Specification — ScholarWork Global Firestore Rules

## 1. Data Invariants
1. **Strict Ownership**: Every document under `/users/{userId}` and its subcollections (`savedPrograms`, `vaultDocuments`) belongs exclusively to `request.auth.uid == userId`. No cross-user reads or writes are permitted.
2. **Email Verification Gate**: All standard writes require `request.auth != null && request.auth.token.email_verified == true`.
3. **Immutable Ownership & Creation Time**: `uid` / `userId` and `createdAt` cannot change after creation.
4. **Server Timestamps**: `createdAt` on create and `updatedAt` on create/update must equal `request.time`.
5. **Strict Key & Size Allowlisting**: Every entity rejects unknown shadow keys and enforces `.size()` limits on all strings and bounded arrays.

## 2. Adversarial "Dirty Dozen" Payloads (Expected: PERMISSION_DENIED)
1. Unauthenticated read on `/users/{uid}`.
2. Authenticated but unverified user (`email_verified == false`) attempting to write `/users/{uid}`.
3. User A attempting to read or write `/users/{userB}/vaultDocuments/{docId}`.
4. Shadow field injection on `/users/{uid}` (e.g., `role: "admin"`, `isAdmin: true`).
5. Spoofed `uid` field in `/users/{uid}` payload (`uid != request.auth.uid`).
6. Oversized `title` (> 160 chars) in `/users/{uid}/vaultDocuments/{docId}`.
7. Invalid `status` enum (`"Approved"`) in `vaultDocuments`.
8. Client-forged `createdAt` timestamp (`!= request.time`).
9. Mutating immutable `createdAt` or `userId` during `update`.
10. Document ID longer than 128 chars or containing invalid characters (`../bad`).
11. Unbounded `majors` array (> 3 items) or `targetCountries` (> 10 items) in onboarding.
12. `allow list` query attempt without matching `userId == request.auth.uid`.
