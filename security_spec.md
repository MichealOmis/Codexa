# PyTutor Security Specification & Dirty Dozen Audit Matrix

## 1. Data Invariants

1. **User Identity Invariant**: A user document at `/users/{userId}` can only be read or written by the authenticated user whose `request.auth.uid == userId` or an authorized administrator. Users cannot escalate their own role (`role` field cannot be self-modified to `instructor` or `researcher` without administrative privilege).
2. **Leaderboard Invariant**: An anonymized leaderboard document at `/leaderboard/{participantId}` can only be written by authenticated users where `request.auth.uid == incoming().userId`. The participant ID must adhere to strict sanitization format (`^[a-zA-Z0-9_\-]+$`) and cannot exceed 64 characters.
3. **Attempt Log Invariant**: An exercise attempt at `/attempts/{attemptId}` can only be submitted where `incoming().userId == request.auth.uid`. Attempts are append-only / immutable once recorded.
4. **Global Safety Net**: All paths outside declared collections default to `allow read, write: if false;`.

## 2. The Dirty Dozen Payloads

1. **Payload 1 (Ghost Field Escalation)**: Attempting to write an unauthorized field (`isAdmin: true`) on user profile. Expected: PERMISSION_DENIED.
2. **Payload 2 (Cross-User Write)**: Authenticated user `student_A` attempting to write to `/users/student_B`. Expected: PERMISSION_DENIED.
3. **Payload 3 (Unauthenticated Read)**: Unauthenticated visitor attempting to read `/users/student_A`. Expected: PERMISSION_DENIED.
4. **Payload 4 (Oversized ID Poisoning)**: Attempting to create an entry with a 2000-character document ID. Expected: PERMISSION_DENIED.
5. **Payload 5 (Identity Spoofing in Leaderboard)**: Authenticated user `student_A` submitting a leaderboard document with `userId: "student_B"`. Expected: PERMISSION_DENIED.
6. **Payload 6 (Oversized Payload / Denial of Wallet)**: Submitting a string exceeding `maxLength` boundary in `username` (> 100 chars). Expected: PERMISSION_DENIED.
7. **Payload 7 (Negative Mastery Points)**: Submitting a negative `masteryPoints: -500`. Expected: PERMISSION_DENIED.
8. **Payload 8 (Invalid Role Assignment)**: Submitting a user record with `role: "superadmin"` which is not in the allowed enum. Expected: PERMISSION_DENIED.
9. **Payload 9 (Cross-User Attempt Spoofing)**: Submitting an exercise attempt with `userId: "instructor_1"` from an unprivileged session. Expected: PERMISSION_DENIED.
10. **Payload 10 (Attempt Modification / Mutation)**: Updating an existing immutable attempt log. Expected: PERMISSION_DENIED.
11. **Payload 11 (Blanket Collection Scraping)**: Requesting list of all `/users` without scoping by user identity. Expected: PERMISSION_DENIED.
12. **Payload 12 (Arbitrary Path Injection)**: Attempting to write to `/admin_secrets/config`. Expected: PERMISSION_DENIED.
