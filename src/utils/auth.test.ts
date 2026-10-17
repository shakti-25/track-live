import test from 'node:test';
import assert from 'node:assert/strict';
import {
  verifyAuthorisedCredential,
  canAccessAuthorisedFeatures,
} from './auth.ts';
import type { AuthSession } from './auth.ts';

test('verifyAuthorisedCredential approves manager PIN 8899', () => {
  const result = verifyAuthorisedCredential('8899');
  assert.equal(result.success, true);
  assert.equal(result.role, 'authorised_manager');
});

test('verifyAuthorisedCredential approves admin passkey admin2026', () => {
  const result = verifyAuthorisedCredential('admin2026');
  assert.equal(result.success, true);
  assert.equal(result.role, 'authorised_manager');
});

test('verifyAuthorisedCredential approves authorised user email nayanchildoffice@gmail.com', () => {
  const result = verifyAuthorisedCredential('nayanchildoffice@gmail.com');
  assert.equal(result.success, true);
  assert.equal(result.role, 'authorised_manager');
});

test('verifyAuthorisedCredential rejects unauthorized inputs', () => {
  const result = verifyAuthorisedCredential('random_salesperson');
  assert.equal(result.success, false);
  assert.equal(result.role, 'field_salesperson');
});

test('canAccessAuthorisedFeatures only grants access to authenticated managers', () => {
  const anonSession: AuthSession = {
    isAuthenticated: false,
    role: 'field_salesperson',
  };
  assert.equal(canAccessAuthorisedFeatures(anonSession), false);

  const salesSession: AuthSession = {
    isAuthenticated: true,
    role: 'field_salesperson',
  };
  assert.equal(canAccessAuthorisedFeatures(salesSession), false);

  const managerSession: AuthSession = {
    isAuthenticated: true,
    role: 'authorised_manager',
    email: 'nayanchildoffice@gmail.com',
  };
  assert.equal(canAccessAuthorisedFeatures(managerSession), true);
});
