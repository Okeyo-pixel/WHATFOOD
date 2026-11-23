import { MEALS_PART_1 } from './mealsPart1';
import { MEALS_PART_2 } from './mealsPart2';
import type { Meal } from './types';

export * from './types';

export const MEALS: Meal[] = [...MEALS_PART_1, ...MEALS_PART_2];