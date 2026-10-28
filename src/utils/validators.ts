import { z } from 'zod';

const CONTROL_CHARS = /[\u0000-\u001F\u007F]/;

export const safeText = (label = 'value') =>
  z
    .string({
      required_error: `${label} is required`,
      invalid_type_error: `${label} must be a string`,
    })
    .trim()
    .transform((value) => value.normalize('NFC'))
    .refine((value) => !CONTROL_CHARS.test(value), `${label} contains control characters`)
    .refine((value) => !/[<>]/.test(value), `${label} must not contain < or >`);

export const blankToUndefined = (value: unknown): unknown =>
  typeof value === 'string' && value.trim() === '' ? undefined : value;
