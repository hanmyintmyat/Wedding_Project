import assert from 'node:assert/strict';
import { test } from 'node:test';
import { studioDestination, studioLoginPath, studioPath } from '../lib/admin-routes';

test('studio login callbacks stay within the new administration area', () => {
  assert.equal(studioPath, '/wedding-studio');
  assert.equal(studioLoginPath, '/wedding-studio/login');
  for (const callback of ['/wedding-studio', '/wedding-studio/media', '/wedding-studio/guests?page=2#guest']) assert.equal(studioDestination(callback), callback);
  for (const callback of [null, '', '/admin', '/admin/media', '/', '//evil.example', 'https://evil.example/wedding-studio', '/wedding-studio-evil', '/wedding-studio/../api/admin/guests', '/\\evil.example/wedding-studio']) assert.equal(studioDestination(callback), studioPath);
});
