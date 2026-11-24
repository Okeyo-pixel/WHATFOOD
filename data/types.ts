export type PrimaryCategory =
  | 'ugali'
  | 'rice'
  | 'tubers'
  | 'chapati'
  | 'light'
  | 'lunch'
  | 'breakfast'
  | 'snacks';

export type MealVibe =
  | 'kienyeji'
  | 'light'
  | 'lunch'
  | 'breakfast'
  | 'snacks';

export type FoodRegion =
  | 'swahili'
  | 'western'
  | 'central'
  | 'highland'
  | 'urban';

export type FeastSubCategory =
  | 'choma'
  | 'seafood'
  | 'asian'
  | 'bistro'
  | 'roasts'
  | 'brunch';

export type FeastVibeFilterId = 'all' | FeastSubCategory;

export type ServingTier = 'Solo Treat' | 'Date Night (2)' | 'Hosting (3–4)';

export type FilterCategoryId =
  | 'all'
  | PrimaryCategory
  | 'kienyeji'
  | 'feast';

export type RegionFilterId = 'all' | FoodRegion;

export type VendorType =
  | 'Butchery'
  | 'Mama Mboga'
  | 'Kiosk / Duka'
  | 'Kibanda / Bakery'
  | 'Pantry Buffer'
  | 'Supermarket'
  | 'Prime Butchery / Fishmonger'
  | 'Specialty Grocer'
  | 'Artisan Bakery / Deli';

export interface ShoppingItem {
  name: string;
  quantity: string;
  vendor: VendorType;
  costKes: number;
}

export interface NutritionProfile {
  carb: string;
  protein: string;
  greens: string;
}

export interface Meal {
  id: string;
  name: string;
  shortLabel: string;
  emoji: string;
  category: PrimaryCategory;
  vibes: MealVibe[];
  isKienyeji: boolean;
  region: FoodRegion;
  totalCostKes: number;
  prepMinutes: number;
  wheelColor: string;
  tagline: string;
  localLore: string;
  nutrition: NutritionProfile;
  shoppingList: ShoppingItem[];
  cookingSteps: string[];
  localTip: string;
  // Payday / "Feeling Rich?" metadata (undefined for everyday 80–500 bob meals)
  isFeast?: boolean;
  feastCategory?: FeastSubCategory;
  servingTier?: ServingTier;
}

export interface CategoryBubble {
  id: FilterCategoryId;
  label: string;
  emoji: string;
}

export interface RegionPill {
  id: RegionFilterId;
  label: string;
  emoji: string;
}

export interface FeastVibePill {
  id: FeastVibeFilterId;
  label: string;
  emoji: string;
}

export const MIN_BUDGET_KES = 80;
export const MAX_BUDGET_KES = 500;
export const BUDGET_PRESETS = [150, 250, 350, 450, 500] as const;

export const FEAST_MIN_BUDGET_KES = 500;
export const FEAST_MAX_BUDGET_KES = 5000;
export const FEAST_BUDGET_PRESETS = [1000, 2000, 3000, 4000, 5000] as const;

export const CATEGORY_BUBBLES: CategoryBubble[] = [
  { id: 'all', label: 'All 112 Meals', emoji: '🍽️' },
  { id: 'ugali', label: 'Ugali Classics', emoji: '🌽' },
  { id: 'rice', label: 'Rice & Pilau', emoji: '🍚' },
  { id: 'tubers', label: 'Mash, Mukimo & Matoke', emoji: '🥔' },
  { id: 'chapati', label: 'Chapati Combos', emoji: '🫓' },
  { id: 'kienyeji', label: 'Kienyeji Lovers', emoji: '🥬' },
  { id: 'light', label: 'Light Supper', emoji: '🥗' },
  { id: 'lunch', label: 'Supper Like Lunch', emoji: '🍛' },
  { id: 'breakfast', label: 'Supper Like Breakfast', emoji: '☕' },
  { id: 'snacks', label: 'Snacks & Bites', emoji: '🍢' },
  { id: 'feast', label: 'Feeling Rich?', emoji: '👑' },
];

export const FEAST_VIBE_PILLS: FeastVibePill[] = [
  { id: 'all', label: 'All Feasts', emoji: '👑' },
  { id: 'choma', label: 'Choma & Steakhouse', emoji: '🥩' },
  { id: 'seafood', label: 'Pwani Seafood & Swahili', emoji: '🦐' },
  { id: 'asian', label: 'Indian & Asian Kitchen', emoji: '🍛' },
  { id: 'bistro', label: 'Creamy Pasta & Bistro', emoji: '🍝' },
  { id: 'roasts', label: 'Roasts & Slow-Cooked', emoji: '🍗' },
  { id: 'brunch', label: 'Boujee Brunch & Platters', emoji: '🥂' },
];

export const REGION_PILLS: RegionPill[] = [
  { id: 'all', label: 'All Kenya', emoji: '🇰🇪' },
  { id: 'swahili', label: 'Swahili / Pwani', emoji: '🌴' },
  { id: 'western', label: 'Western & Lake', emoji: '🐟' },
  { id: 'central', label: 'Central & Mt. Kenya', emoji: '⛰️' },
  { id: 'highland', label: 'Kisii & Highland', emoji: '🌾' },
  { id: 'urban', label: 'Urban Bistro / Mtaa', emoji: '🏙️' },
];

export const REGION_LABELS: Record<FoodRegion, string> = {
  swahili: 'Swahili / Pwani',
  western: 'Western & Lake',
  central: 'Central & Mt. Kenya',
  highland: 'Kisii & Highland',
  urban: 'Urban Mtaa / Bistro',
};

const WHEEL_PALETTE = [
  '#FFC244',
  '#00A082',
  '#FF7A59',
  '#38B2AC',
  '#F59E0B',
  '#10B981',
  '#0EA5E9',
  '#EC4899',
  '#8B5CF6',
  '#22C55E',
  '#EF4444',
  '#D97706',
  '#14B8A6',
  '#F97316',
  '#6366F1',
  '#E11D48',
];

export type CompactItem = [string, string, VendorType, number];

let colorCursor = 0;

/**
 * Builder for everyday 80–500 bob meals.
 */
export function defineMeal(
  id: string,
  name: string,
  shortLabel: string,
  emoji: string,
  category: PrimaryCategory,
  vibes: MealVibe[],
  region: FoodRegion,
  prepMinutes: number,
  tagline: string,
  localLore: string,
  nutrition: [string, string, string],
  items: CompactItem[],
  cookingSteps: string[],
  localTip: string
): Meal {
  const shoppingList: ShoppingItem[] = items.map(
    ([itemName, quantity, vendor, costKes]) => ({
      name: itemName,
      quantity,
      vendor,
      costKes,
    })
  );
  const totalCostKes = shoppingList.reduce((sum, item) => sum + item.costKes, 0);
  const wheelColor = WHEEL_PALETTE[colorCursor % WHEEL_PALETTE.length];
  colorCursor += 1;

  return {
    id,
    name,
    shortLabel,
    emoji,
    category,
    vibes,
    isKienyeji: vibes.includes('kienyeji'),
    region,
    totalCostKes,
    prepMinutes,
    wheelColor,
    tagline,
    localLore,
    nutrition: {
      carb: nutrition[0],
      protein: nutrition[1],
      greens: nutrition[2],
    },
    shoppingList,
    cookingSteps,
    localTip,
  };
}

/**
 * Builder for "Feeling Rich?" payday & hosting feasts (500–5,000 bob).
 */
export function defineFeastMeal(
  id: string,
  name: string,
  shortLabel: string,
  emoji: string,
  plateStyle: PrimaryCategory,
  feastCategory: FeastSubCategory,
  servingTier: ServingTier,
  region: FoodRegion,
  prepMinutes: number,
  tagline: string,
  localLore: string,
  nutrition: [string, string, string],
  items: CompactItem[],
  cookingSteps: string[],
  localTip: string
): Meal {
  const base = defineMeal(
    id,
    name,
    shortLabel,
    emoji,
    plateStyle,
    [],
    region,
    prepMinutes,
    tagline,
    localLore,
    nutrition,
    items,
    cookingSteps,
    localTip
  );

  return {
    ...base,
    isFeast: true,
    feastCategory,
    servingTier,
  };
}

/**
 * Filters everyday 80–500 bob meals.
 */
export function filterMeals(
  meals: Meal[],
  maxBudgetKes: number,
  activeCategory: FilterCategoryId,
  activeRegion: RegionFilterId = 'all',
  searchQuery = ''
): Meal[] {
  const q = searchQuery.trim().toLowerCase();

  return meals.filter((meal) => {
    if (meal.totalCostKes > maxBudgetKes) return false;
    if (activeRegion !== 'all' && meal.region !== activeRegion) return false;

    if (q) {
      const haystack =
        `${meal.name} ${meal.shortLabel} ${meal.tagline} ${meal.localLore} ${meal.nutrition.carb} ${meal.nutrition.protein} ${meal.nutrition.greens}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }

    switch (activeCategory) {
      case 'all':
      case 'feast':
        return true;
      case 'kienyeji':
        return meal.isKienyeji;
      case 'light':
      case 'lunch':
      case 'breakfast':
      case 'snacks':
        return (
          meal.category === activeCategory ||
          meal.vibes.includes(activeCategory)
        );
      default:
        return meal.category === activeCategory;
    }
  });
}

/**
 * Filters "Feeling Rich?" payday feasts (500–5,000 bob) by ceiling, payday vibe, region, and search.
 */
export function filterFeastMeals(
  feasts: Meal[],
  maxBudgetKes: number,
  activeFeastVibe: FeastVibeFilterId,
  activeRegion: RegionFilterId = 'all',
  searchQuery = ''
): Meal[] {
  const q = searchQuery.trim().toLowerCase();

  return feasts.filter((meal) => {
    if (meal.totalCostKes > maxBudgetKes) return false;
    if (activeFeastVibe !== 'all' && meal.feastCategory !== activeFeastVibe) {
      return false;
    }
    if (activeRegion !== 'all' && meal.region !== activeRegion) return false;

    if (q) {
      const haystack =
        `${meal.name} ${meal.shortLabel} ${meal.tagline} ${meal.localLore} ${meal.servingTier ?? ''} ${meal.nutrition.carb} ${meal.nutrition.protein} ${meal.nutrition.greens}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }

    return true;
  });
}