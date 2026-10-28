import { z } from 'zod';
import { USER_LIMITS } from '../../constants/index.js';
import { safeText } from '../../utils/validators.js';

export const updateMeDto = z.strictObject({
  name: safeText('name').refine(
    (value) => value.length >= USER_LIMITS.NAME_MIN && value.length <= USER_LIMITS.NAME_MAX,
    `name must be ${USER_LIMITS.NAME_MIN} to ${USER_LIMITS.NAME_MAX} characters`,
  ),
});
export type UpdateMeDto = z.infer<typeof updateMeDto>;
