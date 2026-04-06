import { describe, it, expect } from 'vitest';
import { mapErrorCodeToMessage, getFieldValidationErrors } from './errorMapper';

describe('mapErrorCodeToMessage', () => {
    it('returns the mapped message for a known error code', () => {
        const msg = mapErrorCodeToMessage('AUTH_005');
        expect(msg).toContain('Invalid username or password');
    });

    it('returns fallback message for unknown error code', () => {
        const msg = mapErrorCodeToMessage('UNKNOWN_999');
        expect(msg).toBe('Something went wrong. Please try again.');
    });

    it('returns fallback message when errorCode is null', () => {
        const msg = mapErrorCodeToMessage(null);
        expect(msg).toBe('Something went wrong. Please try again.');
    });

    it('uses data.message as fallback for unknown codes', () => {
        const msg = mapErrorCodeToMessage('UNKNOWN_999', { message: 'Custom error' });
        expect(msg).toBe('Custom error');
    });

    it('uses data.defaultMessage as fallback for unknown codes when message is absent', () => {
        const msg = mapErrorCodeToMessage('UNKNOWN_999', { defaultMessage: 'Default fallback' });
        expect(msg).toBe('Default fallback');
    });

    it('interpolates {seconds} in OTP_001 message', () => {
        const msg = mapErrorCodeToMessage('OTP_001', { seconds: 45 });
        expect(msg).toContain('45');
    });

    it('interpolates {minutes} in OTP_002 message', () => {
        const msg = mapErrorCodeToMessage('OTP_002', { minutes: 5 });
        expect(msg).toContain('5');
    });

    it('uses default seconds value when data is empty for OTP_001', () => {
        const msg = mapErrorCodeToMessage('OTP_001', {});
        expect(msg).toContain('60');
    });

    it('returns AUTH_008 message for Google account password restriction', () => {
        const msg = mapErrorCodeToMessage('AUTH_008');
        expect(msg).toContain('Google');
    });
});

describe('getFieldValidationErrors', () => {
    it('returns empty object when data is empty', () => {
        expect(getFieldValidationErrors({})).toEqual({});
    });

    it('returns empty object when validation_error_list is absent', () => {
        expect(getFieldValidationErrors({ other: 'data' })).toEqual({});
    });

    it('returns errors keyed by field name', () => {
        const data = {
            validation_error_list: [
                { field: 'email', message: 'Email is required' },
                { field: 'password', message: 'Password too short' },
            ],
        };
        const result = getFieldValidationErrors(data);
        expect(result.email).toEqual(['Email is required']);
        expect(result.password).toEqual(['Password too short']);
    });

    it('accumulates multiple errors for the same field', () => {
        const data = {
            validation_error_list: [
                { field: 'email', message: 'Email is required' },
                { field: 'email', message: 'Email is invalid' },
            ],
        };
        const result = getFieldValidationErrors(data);
        expect(result.email).toHaveLength(2);
    });

    it('supports camelCase validationErrorList key', () => {
        const data = {
            validationErrorList: [
                { field: 'username', message: 'Too short' },
            ],
        };
        const result = getFieldValidationErrors(data);
        expect(result.username).toEqual(['Too short']);
    });

    it('skips entries without field or message', () => {
        const data = {
            validation_error_list: [
                { field: 'email', message: 'Valid error' },
                { field: '', message: 'Missing field' },
                { field: 'phone' },
            ],
        };
        const result = getFieldValidationErrors(data);
        expect(Object.keys(result)).toHaveLength(1);
        expect(result.email).toEqual(['Valid error']);
    });

    it('returns empty object when validation_error_list is not an array', () => {
        const result = getFieldValidationErrors({ validation_error_list: 'not-an-array' });
        expect(result).toEqual({});
    });
});
