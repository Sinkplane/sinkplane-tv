const AVPLAYER_MAX_AUDIBLE_RATE = 2;

const PLAYBACK_SPEED = {
  half: 0.5,
  threeQuarters: 0.75,
  normal: 1,
  oneAndAQuarter: 1.25,
  oneAndAHalf: 1.5,
  oneAndThreeQuarters: 1.75,
  double: AVPLAYER_MAX_AUDIBLE_RATE,
} as const;

export const NORMAL_PLAYBACK_RATE = PLAYBACK_SPEED.normal;

export const PLAYBACK_SPEEDS: number[] = Object.values(PLAYBACK_SPEED);
