import { MEALS_PART_1 } from './mealsPart1';
import { MEALS_PART_2 } from './mealsPart2';
import { FEAST_PART_1 } from './feastPart1';
import { FEAST_PART_2 } from './feastPart2';
import { FEAST_PART_3 } from './feastPart3';
import type { Meal } from './types';

export * from './types';

/** Everyday Kenyan suppers & street bites (112 meals, 80–500 bob). */
export const MEALS: Meal[] = [...MEALS_PART_1, ...MEALS_PART_2];

/** Independent "Feeling Rich?" payday & hosting feasts (114 meals, 500–5,000 bob). */
export const FEAST_MEALS: Meal[] = [
  ...FEAST_PART_1,
  ...FEAST_PART_2,
  ...FEAST_PART_3,
];