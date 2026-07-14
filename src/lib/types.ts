export type SoftUser = {
  id: string;
  nickname: string;
  createdAt: string;
};

export type SessionRecord = {
  id: string;
  softUserId: string;
  startedAt: string;
  endedAt: string;
  reps: number;
  targetReps: number;
  cleared: boolean;
  durationMs: number;
  challengeId?: string;
  ruleVersion: string;
};

export type ChallengeStatus = 'open' | 'accepted' | 'completed' | 'expired';

export type Challenge = {
  id: string;
  fromSoftUserId: string;
  fromNickname: string;
  toSoftUserId?: string;
  toNickname?: string;
  targetReps: number;
  deadlineAt: string;
  status: ChallengeStatus;
  ruleVersion: string;
  winMode: 'clear_target';
  fromCleared?: boolean;
  toCleared?: boolean;
  fromSessionId?: string;
  toSessionId?: string;
  createdAt: string;
};

export const RULE_VERSION = 'hss-v3';
