import { describe, expect, it } from 'vitest';
import { shouldShowUpdatePrompt } from './updatePolicy';

const idle = { needRefresh: true, dismissed: false, playing: false, editing: false };

describe('shouldShowUpdatePrompt', () => {
  it('shows when a new version waits and nothing is in progress', () => {
    expect(shouldShowUpdatePrompt(idle)).toBe(true);
  });

  it('waits while a session is playing or the editor is open', () => {
    expect(shouldShowUpdatePrompt({ ...idle, playing: true })).toBe(false);
    expect(shouldShowUpdatePrompt({ ...idle, editing: true })).toBe(false);
  });

  it('stays hidden without a new version or after "Más tarde"', () => {
    expect(shouldShowUpdatePrompt({ ...idle, needRefresh: false })).toBe(false);
    expect(shouldShowUpdatePrompt({ ...idle, dismissed: true })).toBe(false);
  });
});
