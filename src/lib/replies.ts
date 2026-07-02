import type { Tone } from '../types'

/** "Blame the calendar" — the one-tap deflection you paste back into the chat. */
export const DEFLECTIONS: Record<Tone, string> = {
  gentle:
    "That sounds so fun! Let me check my calendar when I'm home and I'll text you 💜",
  firm: 'Let me check my calendar and get back to you tomorrow.',
  snarky:
    'My calendar holds veto power over my life — consulting it and reporting back.',
}

export const DECLINES: Record<Tone, string[]> = {
  gentle: [
    "I'd love to, but this week is already full for me — can we find another time soon? 💜",
    "Thank you for thinking of me! I'm at capacity right now, but I really do want to see you.",
    "I have to sit this one out — I've been overbooked and I'm protecting some quiet time. Rain check?",
  ],
  firm: [
    "I can't make it — my week is already committed.",
    "That doesn't work for me this time. Let's plan something further out.",
    'I already have plans then, so I have to pass.',
  ],
  snarky: [
    'My calendar said no, and honestly I fear it more than I fear disappointing you.',
    "I've exceeded my legally mandated yes-quota for the week. The system won't let me.",
    'RainCheck (the app) has denied this request on my behalf. Take it up with the app.',
  ],
}
