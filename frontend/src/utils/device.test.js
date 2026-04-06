import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getDeviceId } from './device';

describe('getDeviceId', () => {
    let storageMock;

    beforeEach(() => {
        storageMock = (() => {
            let store = {};
            return {
                getItem: (key) => store[key] ?? null,
                setItem: (key, value) => { store[key] = String(value); },
                removeItem: (key) => { delete store[key]; },
                clear: () => { store = {}; },
            };
        })();
        Object.defineProperty(globalThis, 'localStorage', { value: storageMock, writable: true });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('returns a non-empty string', () => {
        const id = getDeviceId();
        expect(typeof id).toBe('string');
        expect(id.length).toBeGreaterThan(0);
    });

    it('returns the same id on subsequent calls', () => {
        const id1 = getDeviceId();
        const id2 = getDeviceId();
        expect(id1).toBe(id2);
    });

    it('stores the device id in localStorage', () => {
        const id = getDeviceId();
        expect(storageMock.getItem('deviceId')).toBe(id);
    });

    it('reuses an existing device id from localStorage', () => {
        storageMock.setItem('deviceId', 'existing-id-123');
        const id = getDeviceId();
        expect(id).toBe('existing-id-123');
    });

    it('generates a new id when localStorage throws', () => {
        Object.defineProperty(globalThis, 'localStorage', {
            get() { throw new Error('storage blocked'); },
            configurable: true,
        });
        const id = getDeviceId();
        expect(typeof id).toBe('string');
        expect(id.length).toBeGreaterThan(0);
    });
});
