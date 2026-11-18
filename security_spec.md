# Security Specification — ScholarWork Global Firestore Rules

## 1. Data Invariants
1. **Strict Ownership (`/users/{userId}`)**: Every document under `/users/{userId}` and its subcollections (`savedPrograms`, `vaultDocuments`, `applications`) belongs exclusively to `request.auth.uid == userId`. No cross-user reads or writes are permitted.
2. **Strict Email Isolation (`/studentPortals/{portalId}`)**: Every document under `/studentPortals/{portalId}` contains a canonical `studentEmail` field. Single-document `get` reads are strictly restricted to an authenticated, email-verified user whose `request.auth.token.email == resource.data.studentEmail` (or the verified platform administrator `mulijosephine446@gmail.com`). Blanket `list` queries on `/studentPortals` are completely forbidden for non-admin students.
3. **Email Verification Gate**: All standard writes and portal reads require `request.auth != null && request.auth.token.email_verified == true`.
4. **Immutable Ownership & Creation Time**: `uid`, `userId`, `portalId`, and `createdAt` cannot change after creation.
5. **Server Timestamps**: `createdAt` on create and `updatedAt` on create/update must equal `request.time`.
6. **Strict Key, Array Bound & Size Allowlisting**: Every entity rejects unknown shadow keys, bounds arrays (`.size() <= MAX`), and enforces `.size()` limits on all strings.

## 2. Adversarial "Dirty Dozen" Payloads (Expected: PERMISSION_DENIED)
1. Unauthenticated read on `/users/{uid}` or `/studentPortals/{portalId}`.
2. Authenticated but unverified user (`email_verified == false`) attempting to write `/users/{uid}` or read `/studentPortals/{portalId}`.
3. User A attempting to read or write `/users/{userB}/vaultDocuments/{docId}`.
4. Student B (`other@gmail.com`) attempting `get` on `/studentPortals/alphonsanthenya806_gmail_com`.
5. Non-admin student attempting a `list` query on `/studentPortals` to enumerate other students.
6. Non-admin student attempting `create`, `update`, or `delete` on `/studentPortals/{portalId}`.
7. Shadow field injection on `/users/{uid}` or `/studentPortals/{portalId}` (e.g., `role: "admin"`, `isAdmin: true`).
8. Spoofed `uid` field in `/users/{uid}` payload (`uid != request.auth.uid`).
9. Oversized `title` (> 160 chars) in `/users/{uid}/vaultDocuments/{docId}`.
10. Client-forged `createdAt` timestamp (`!= request.time`).
11. Mutating immutable `createdAt` or `portalId` during `update`.
12. Document ID longer than 128 chars or containing invalid characters (`../bad`).
