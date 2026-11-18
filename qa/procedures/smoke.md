# Sign in, browse, watch

Preconditions: a TV development build (`pnpm run prebuild:tv`, then `pnpm run ios` or `pnpm run android`) is installed and signed out; the Floatplane test account has an active creator subscription and a phone is at hand to approve the device code.

1. Launch the app → Expect: the sign-in screen shows a QR code and a device code.
2. On the phone, open `floatplane.com/link`, enter the code, and approve → Expect: within a few seconds the TV shows the Home tab with the creator's newest videos.
3. Press right on the remote across the first row of cards → Expect: focus moves card by card and the focused card is highlighted.
4. Press select on a focused card → Expect: the video page opens and playback starts within a few seconds.
5. Press play/pause twice → Expect: playback pauses, then resumes from the same position.
6. Press menu/back → Expect: the Home tab returns with focus on the card from step 4.
7. Open the History tab → Expect: the video from step 4 is listed first.
8. Open the Live tab → Expect: each subscribed creator's livestream shows a live or offline state.

Cleanup: sign out from the profile menu so the next run starts signed out.
