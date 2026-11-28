import { describe, expect, it } from 'vitest';
import conf from '../../docker/security-headers.conf?raw';
import { TILE_SOURCES } from './sources';

const policy = /Content-Security-Policy "([^"]+)"/.exec(conf)?.[1] ?? '';
const directive = (name: string) =>
  policy
    .split(';')
    .map((d) => d.trim().split(/\s+/))
    .find(([n]) => n === name)
    ?.slice(1) ?? [];

describe('CSP and tile servers', () => {
  it('lets the app talk to its own origin and the tile servers, nobody else', () => {
    const origins = Object.values(TILE_SOURCES).map(
      (s) => new URL(s.url({ z: 0, x: 0, y: 0 })).origin,
    );
    expect(directive('connect-src').sort()).toEqual(["'self'", ...origins].sort());
  });

  it('keeps images and scripts closed: tiles arrive as blobs through fetch', () => {
    expect(directive('img-src')).toEqual(["'self'", 'data:', 'blob:']);
    expect(directive('script-src')).toEqual(["'self'"]);
    expect(directive('default-src')).toEqual(["'self'"]);
  });
});
