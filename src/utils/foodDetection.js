// src/utils/foodDetection.js

export const FOOD_DATABASE = [
  // Leafy Greens & Fresh Herbs (Very perishable: 2-4 days)
  { keywords: ['coriander', 'cilantro', 'dhaniya'], category: 'Vegetables', shelfLife: 2, storage: 'fridge', track: 'produce', defaultUnit: 'bunch' },
  { keywords: ['spinach', 'palak', 'baby spinach'], category: 'Vegetables', shelfLife: 3, storage: 'fridge', track: 'produce', defaultUnit: 'g' },
  { keywords: ['methi', 'fenugreek'], category: 'Vegetables', shelfLife: 3, storage: 'fridge', track: 'produce', defaultUnit: 'bunch' },
  { keywords: ['mint', 'pudina'], category: 'Vegetables', shelfLife: 3, storage: 'fridge', track: 'produce', defaultUnit: 'bunch' },
  { keywords: ['curry leaves', 'kadi patta'], category: 'Vegetables', shelfLife: 4, storage: 'fridge', track: 'produce', defaultUnit: 'bunch' },
  { keywords: ['lettuce', 'romaine', 'iceberg', 'arugula', 'kale', 'salad greens'], category: 'Vegetables', shelfLife: 5, storage: 'fridge', track: 'produce', defaultUnit: 'pcs' },

  // Vegetables
  { keywords: ['mushroom', 'mushrooms', 'button mushroom'], category: 'Vegetables', shelfLife: 3, storage: 'fridge', track: 'produce', defaultUnit: 'g' },
  { keywords: ['bhindi', 'okra', 'lady finger'], category: 'Vegetables', shelfLife: 4, storage: 'fridge', track: 'produce', defaultUnit: 'kg' },
  { keywords: ['tomato', 'tomatoes', 'cherry tomato'], category: 'Vegetables', shelfLife: 5, storage: 'counter', track: 'produce', defaultUnit: 'kg' },
  { keywords: ['beans', 'green beans', 'french beans', 'string beans'], category: 'Vegetables', shelfLife: 5, storage: 'fridge', track: 'produce', defaultUnit: 'kg' },
  { keywords: ['cucumber', 'cucumbers', 'kheera'], category: 'Vegetables', shelfLife: 6, storage: 'fridge', track: 'produce', defaultUnit: 'pcs' },
  { keywords: ['brinjal', 'eggplant', 'aubergine', 'baingan'], category: 'Vegetables', shelfLife: 5, storage: 'fridge', track: 'produce', defaultUnit: 'kg' },
  { keywords: ['capsicum', 'bell pepper', 'peppers'], category: 'Vegetables', shelfLife: 7, storage: 'fridge', track: 'produce', defaultUnit: 'kg' },
  { keywords: ['green chilli', 'green chillies', 'mirchi', 'chili', 'jalapeno'], category: 'Vegetables', shelfLife: 7, storage: 'fridge', track: 'produce', defaultUnit: 'g' },
  { keywords: ['cauliflower', 'gobi'], category: 'Vegetables', shelfLife: 7, storage: 'fridge', track: 'produce', defaultUnit: 'pcs' },
  { keywords: ['broccoli'], category: 'Vegetables', shelfLife: 6, storage: 'fridge', track: 'produce', defaultUnit: 'pcs' },
  { keywords: ['cabbage', 'patta gobi'], category: 'Vegetables', shelfLife: 10, storage: 'fridge', track: 'produce', defaultUnit: 'pcs' },
  { keywords: ['carrot', 'carrots', 'gajar'], category: 'Vegetables', shelfLife: 12, storage: 'fridge', track: 'produce', defaultUnit: 'kg' },
  { keywords: ['beetroot', 'beets', 'chukandar'], category: 'Vegetables', shelfLife: 14, storage: 'fridge', track: 'produce', defaultUnit: 'kg' },
  { keywords: ['potato', 'potatoes', 'aloo', 'sweet potato'], category: 'Vegetables', shelfLife: 21, storage: 'pantry', track: 'produce', defaultUnit: 'kg' },
  { keywords: ['ginger', 'adrak'], category: 'Vegetables', shelfLife: 21, storage: 'fridge', track: 'produce', defaultUnit: 'g' },
  { keywords: ['onion', 'onions', 'pyaz', 'shallot', 'shallots'], category: 'Vegetables', shelfLife: 28, storage: 'pantry', track: 'produce', defaultUnit: 'kg' },
  { keywords: ['garlic', 'lahsun'], category: 'Vegetables', shelfLife: 30, storage: 'pantry', track: 'produce', defaultUnit: 'pcs' },
  { keywords: ['corn', 'sweet corn', 'peas', 'green peas', 'matar', 'zucchini', 'squash'], category: 'Vegetables', shelfLife: 5, storage: 'fridge', track: 'produce', defaultUnit: 'kg' },

  // Fruits
  { keywords: ['strawberry', 'strawberries', 'berry', 'berries', 'blueberry', 'blueberries', 'raspberry', 'blackberries'], category: 'Fruit', shelfLife: 3, storage: 'fridge', track: 'produce', defaultUnit: 'pack' },
  { keywords: ['banana', 'bananas', 'kela'], category: 'Fruit', shelfLife: 4, storage: 'counter', track: 'produce', defaultUnit: 'kg' },
  { keywords: ['avocado', 'avocados', 'hass avocado'], category: 'Fruit', shelfLife: 5, storage: 'counter', track: 'produce', defaultUnit: 'pcs' },
  { keywords: ['grape', 'grapes', 'angoor'], category: 'Fruit', shelfLife: 6, storage: 'fridge', track: 'produce', defaultUnit: 'kg' },
  { keywords: ['watermelon', 'melon', 'cantaloupe', 'honeydew', 'papaya', 'mango', 'mangoes'], category: 'Fruit', shelfLife: 5, storage: 'counter', track: 'produce', defaultUnit: 'pcs' },
  { keywords: ['orange', 'oranges', 'mandarin', 'tangerine', 'santre'], category: 'Fruit', shelfLife: 10, storage: 'fridge', track: 'produce', defaultUnit: 'kg' },
  { keywords: ['lemon', 'lemons', 'lime', 'limes', 'nimbu'], category: 'Fruit', shelfLife: 14, storage: 'fridge', track: 'produce', defaultUnit: 'pcs' },
  { keywords: ['apple', 'apples', 'seb', 'pear', 'pears'], category: 'Fruit', shelfLife: 14, storage: 'fridge', track: 'produce', defaultUnit: 'kg' },
  { keywords: ['peach', 'plum', 'apricot', 'kiwi', 'pineapple', 'pomegranate'], category: 'Fruit', shelfLife: 6, storage: 'fridge', track: 'produce', defaultUnit: 'kg' },

  // Dairy
  { keywords: ['curd', 'dahi'], category: 'Dairy', shelfLife: 5, storage: 'fridge', track: 'produce', defaultUnit: 'g' },
  { keywords: ['paneer', 'cottage cheese'], category: 'Dairy', shelfLife: 5, storage: 'fridge', track: 'produce', defaultUnit: 'g' },
  { keywords: ['milk', 'whole milk', 'skim milk', 'toned milk', 'almond milk', 'oat milk', 'soy milk', 'cow milk'], category: 'Dairy', shelfLife: 6, storage: 'fridge', track: 'produce', defaultUnit: 'L' },
  { keywords: ['yogurt', 'greek yogurt', 'flavored yogurt'], category: 'Dairy', shelfLife: 10, storage: 'fridge', track: 'produce', defaultUnit: 'g' },
  { keywords: ['cream', 'heavy cream', 'sour cream', 'whipping cream', 'malai'], category: 'Dairy', shelfLife: 7, storage: 'fridge', track: 'produce', defaultUnit: 'ml' },
  { keywords: ['cheese', 'cheddar', 'mozzarella', 'parmesan', 'feta', 'gouda', 'cheese slice'], category: 'Dairy', shelfLife: 14, storage: 'fridge', track: 'produce', defaultUnit: 'g' },
  { keywords: ['butter', 'salted butter', 'unsalted butter', 'makkhan'], category: 'Dairy', shelfLife: 30, storage: 'fridge', track: 'produce', defaultUnit: 'g' },
  { keywords: ['ghee'], category: 'Dairy', shelfLife: 90, storage: 'pantry', track: 'pantry', defaultUnit: 'ml' },

  // Meat, Seafood & Protein
  { keywords: ['chicken', 'chicken breast', 'chicken thighs', 'chicken wings', 'murgh', 'poultry'], category: 'Meat', shelfLife: 2, storage: 'fridge', track: 'produce', defaultUnit: 'kg' },
  { keywords: ['fish', 'salmon', 'tuna', 'cod', 'tilapia', 'rohu', 'catla', 'prawns', 'shrimp', 'crab', 'seafood'], category: 'Meat', shelfLife: 2, storage: 'fridge', track: 'produce', defaultUnit: 'kg' },
  { keywords: ['mutton', 'lamb', 'goat meat'], category: 'Meat', shelfLife: 3, storage: 'fridge', track: 'produce', defaultUnit: 'kg' },
  { keywords: ['beef', 'ground beef', 'steak', 'pork', 'bacon', 'ham', 'sausage'], category: 'Meat', shelfLife: 3, storage: 'fridge', track: 'produce', defaultUnit: 'kg' },
  { keywords: ['egg', 'eggs', 'anda', 'brown eggs'], category: 'Meat', shelfLife: 21, storage: 'fridge', track: 'produce', defaultUnit: 'pcs' },

  // Bakery
  { keywords: ['bread', 'white bread', 'brown bread', 'whole wheat bread', 'multigrain bread', 'toast'], category: 'Bakery', shelfLife: 4, storage: 'counter', track: 'produce', defaultUnit: 'pack' },
  { keywords: ['sourdough', 'sourdough bread'], category: 'Bakery', shelfLife: 5, storage: 'counter', track: 'produce', defaultUnit: 'pack' },
  { keywords: ['roti', 'chapati', 'paratha', 'naan', 'tortilla', 'pita'], category: 'Bakery', shelfLife: 2, storage: 'counter', track: 'produce', defaultUnit: 'pack' },
  { keywords: ['croissant', 'croissants', 'muffin', 'muffins', 'bun', 'buns', 'bagel', 'bagels'], category: 'Bakery', shelfLife: 3, storage: 'counter', track: 'produce', defaultUnit: 'pcs' },

  // Pantry Staples (Dry goods)
  { keywords: ['rice', 'basmati', 'basmati rice', 'brown rice', 'chawal'], category: 'Pantry', shelfLife: 90, storage: 'pantry', track: 'pantry', defaultUnit: 'kg' },
  { keywords: ['dal', 'toor dal', 'moong dal', 'chana dal', 'urad dal', 'masoor dal', 'lentils', 'beans', 'rajma', 'chole', 'chickpeas'], category: 'Pantry', shelfLife: 90, storage: 'pantry', track: 'pantry', defaultUnit: 'kg' },
  { keywords: ['flour', 'atta', 'whole wheat atta', 'maida', 'besan', 'sooji', 'semolina', 'wheat flour'], category: 'Pantry', shelfLife: 60, storage: 'pantry', track: 'pantry', defaultUnit: 'kg' },
  { keywords: ['oil', 'cooking oil', 'sunflower oil', 'mustard oil', 'olive oil', 'coconut oil'], category: 'Pantry', shelfLife: 90, storage: 'pantry', track: 'pantry', defaultUnit: 'L' },
  { keywords: ['pasta', 'spaghetti', 'macaroni', 'penne', 'noodles', 'maggi'], category: 'Pantry', shelfLife: 90, storage: 'pantry', track: 'pantry', defaultUnit: 'g' },
  { keywords: ['cereal', 'oats', 'cornflakes', 'muesli', 'granola'], category: 'Pantry', shelfLife: 60, storage: 'pantry', track: 'pantry', defaultUnit: 'g' },
  { keywords: ['sugar', 'salt', 'spices', 'masala', 'turmeric', 'haldi', 'chilli powder', 'pepper', 'sauce', 'ketchup', 'honey', 'jam'], category: 'Pantry', shelfLife: 120, storage: 'pantry', track: 'pantry', defaultUnit: 'g' },
];

function matchesKeyword(text, kw) {
  const esc = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|\\b)${esc}(\\b|$)`, 'i').test(text);
}

/**
 * Extracts quantity and measurement unit from item string (e.g. "2 kg tomatoes", "1 liter milk", "1.5 gallon juice")
 */
export function parseQuantityAndUnit(text = '') {
  if (!text || typeof text !== 'string') return null;

  // Leading quantity: e.g., "2 kg spinach", "1.5 liter milk", "0.5 gallon apple juice", "500g paneer"
  const leadingRegex = /^([\d.]+)\s*(kg|kilograms?|kilo|g|grams?|liters?|litres?|l|milliliters?|ml|gallons?|gal|lbs?|pounds?|oz|ounces?|pcs|pieces?|packs?|packet|packets?|bunches?|bunch)\b\s*(.*)$/i;
  const match = text.trim().match(leadingRegex);
  if (match) {
    const val = parseFloat(match[1]) || 1;
    const rawUnit = match[2].toLowerCase();
    const cleanItemName = match[3].trim();

    let unit = 'kg';
    if (/^(kg|kilograms?|kilo)$/.test(rawUnit)) unit = 'kg';
    else if (/^(g|grams?)$/.test(rawUnit)) unit = 'g';
    else if (/^(liters?|litres?|l)$/.test(rawUnit)) unit = 'L';
    else if (/^(milliliters?|ml)$/.test(rawUnit)) unit = 'ml';
    else if (/^(gallons?|gal)$/.test(rawUnit)) unit = 'gal';
    else if (/^(lbs?|pounds?)$/.test(rawUnit)) unit = 'lbs';
    else if (/^(oz|ounces?)$/.test(rawUnit)) unit = 'oz';
    else if (/^(pcs|pieces?)$/.test(rawUnit)) unit = 'pcs';
    else if (/^(packs?|packet|packets?)$/.test(rawUnit)) unit = 'pack';
    else if (/^(bunches?|bunch)$/.test(rawUnit)) unit = 'bunch';

    return { quantity: val, unit, cleanName: cleanItemName };
  }

  // Trailing quantity: e.g., "whole milk 1 gallon", "tomatoes 2kg"
  const trailingRegex = /^(.*?)\s+([\d.]+)\s*(kg|kilograms?|kilo|g|grams?|liters?|litres?|l|milliliters?|ml|gallons?|gal|lbs?|pounds?|oz|ounces?|pcs|pieces?|packs?|packet|packets?|bunches?|bunch)$/i;
  const endMatch = text.trim().match(trailingRegex);
  if (endMatch) {
    const cleanItemName = endMatch[1].trim();
    const val = parseFloat(endMatch[2]) || 1;
    const rawUnit = endMatch[3].toLowerCase();

    let unit = 'kg';
    if (/^(kg|kilograms?|kilo)$/.test(rawUnit)) unit = 'kg';
    else if (/^(g|grams?)$/.test(rawUnit)) unit = 'g';
    else if (/^(liters?|litres?|l)$/.test(rawUnit)) unit = 'L';
    else if (/^(milliliters?|ml)$/.test(rawUnit)) unit = 'ml';
    else if (/^(gallons?|gal)$/.test(rawUnit)) unit = 'gal';
    else if (/^(lbs?|pounds?)$/.test(rawUnit)) unit = 'lbs';
    else if (/^(oz|ounces?)$/.test(rawUnit)) unit = 'oz';
    else if (/^(pcs|pieces?)$/.test(rawUnit)) unit = 'pcs';
    else if (/^(packs?|packet|packets?)$/.test(rawUnit)) unit = 'pack';
    else if (/^(bunches?|bunch)$/.test(rawUnit)) unit = 'bunch';

    return { quantity: val, unit, cleanName: cleanItemName };
  }

  return null;
}

/**
 * Automatically detects the food category, shelf life days, storage location, track type,
 * and extracted or default quantity measurements (kg, liter, gallon, etc.) from the item name.
 */
export function detectFoodDetails(name = '') {
  if (!name || typeof name !== 'string') return null;

  // Check for embedded quantity & unit
  const parsedQty = parseQuantityAndUnit(name);
  const targetName = parsedQty?.cleanName || name;
  const clean = targetName.toLowerCase().trim();
  if (clean.length < 2) return null;

  // Skip known non-food items
  if (/\b(hammer|drill|wrench|pliers|nails|screws|hardware|cable|charger|battery|batteries|t-shirt|shirt|pants|jeans|shoes|apparel|electronics|tool|tools|shampoo|soap|lotion|detergent|cleaner|bleach|towel|paper towel|toilet paper|tissue|napkin|light bulb)\b/i.test(clean)) {
    return null;
  }

  // 1. Check exact and phrase matches in database with word boundary
  for (const entry of FOOD_DATABASE) {
    for (const kw of entry.keywords) {
      if (matchesKeyword(clean, kw)) {
        return {
          category: entry.category,
          shelfLifeDays: entry.shelfLife,
          storageLocation: entry.storage,
          track: entry.track,
          matchedKeyword: kw,
          quantity: parsedQty ? parsedQty.quantity : 1,
          unit: parsedQty ? parsedQty.unit : (entry.defaultUnit || 'kg'),
          parsedCleanName: targetName,
        };
      }
    }
  }

  // 2. Generic heuristic classification with word boundary
  if (/\b(milk|cheese|yogurt|curd|paneer|cream|butter|dairy)\b/i.test(clean)) {
    const isLiquid = /\b(milk|cream)\b/i.test(clean);
    return {
      category: 'Dairy',
      shelfLifeDays: 6,
      storageLocation: 'fridge',
      track: 'produce',
      matchedKeyword: 'dairy',
      quantity: parsedQty ? parsedQty.quantity : 1,
      unit: parsedQty ? parsedQty.unit : (isLiquid ? 'L' : 'g'),
      parsedCleanName: targetName,
    };
  }
  if (/\b(chicken|meat|beef|pork|mutton|fish|salmon|shrimp|prawn|egg|eggs|poultry|turkey|bacon|sausage)\b/i.test(clean)) {
    const isEggs = /\beggs?\b/i.test(clean);
    return {
      category: 'Meat',
      shelfLifeDays: 3,
      storageLocation: 'fridge',
      track: 'produce',
      matchedKeyword: 'meat',
      quantity: parsedQty ? parsedQty.quantity : 1,
      unit: parsedQty ? parsedQty.unit : (isEggs ? 'pcs' : 'kg'),
      parsedCleanName: targetName,
    };
  }
  if (/\b(berry|strawberr|fruit|fruits|apple|apples|banana|bananas|mango|mangoes|melon|orange|oranges|lemon|lemons|avocado|avocados|grape|grapes|peach|plum)\b/i.test(clean)) {
    return {
      category: 'Fruit',
      shelfLifeDays: 5,
      storageLocation: 'fridge',
      track: 'produce',
      matchedKeyword: 'fruit',
      quantity: parsedQty ? parsedQty.quantity : 1,
      unit: parsedQty ? parsedQty.unit : 'kg',
      parsedCleanName: targetName,
    };
  }
  if (/\b(spinach|lettuce|herb|herbs|green|greens|vegetable|vegetables|sabzi|gobi|potato|potatoes|tomato|tomatoes|carrot|carrots|onion|onions|broccoli|capsicum)\b/i.test(clean)) {
    return {
      category: 'Vegetables',
      shelfLifeDays: 5,
      storageLocation: 'fridge',
      track: 'produce',
      matchedKeyword: 'vegetable',
      quantity: parsedQty ? parsedQty.quantity : 1,
      unit: parsedQty ? parsedQty.unit : 'kg',
      parsedCleanName: targetName,
    };
  }
  if (/\b(bread|toast|bun|buns|bagel|bagels|bakery|roti|paratha|naan|croissant|cake|muffin)\b/i.test(clean)) {
    return {
      category: 'Bakery',
      shelfLifeDays: 4,
      storageLocation: 'counter',
      track: 'produce',
      matchedKeyword: 'bakery',
      quantity: parsedQty ? parsedQty.quantity : 1,
      unit: parsedQty ? parsedQty.unit : 'pack',
      parsedCleanName: targetName,
    };
  }
  if (/\b(rice|oil|flour|dal|atta|spice|spices|cereal|grain|grains|pantry|sugar|salt|pasta|noodle|noodles|oats)\b/i.test(clean)) {
    const isOil = /\boil\b/i.test(clean);
    return {
      category: 'Pantry',
      shelfLifeDays: 60,
      storageLocation: 'pantry',
      track: 'pantry',
      matchedKeyword: 'pantry',
      quantity: parsedQty ? parsedQty.quantity : 1,
      unit: parsedQty ? parsedQty.unit : (isOil ? 'L' : 'kg'),
      parsedCleanName: targetName,
    };
  }

  return parsedQty ? {
    category: 'Vegetables',
    shelfLifeDays: 7,
    storageLocation: 'fridge',
    track: 'produce',
    quantity: parsedQty.quantity,
    unit: parsedQty.unit,
    parsedCleanName: targetName,
  } : null;
}

const SPOKEN_NUMBERS = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  fifteen: 15,
  twenty: 20,
  half: 0.5,
  quarter: 0.25,
  'a dozen': 12,
  dozen: 12,
  'half a dozen': 6,
};

function normalizeSpokenPhrase(phrase) {
  let text = phrase.trim();
  text = text.replace(/^(i\s+(bought|got|have|purchased|need|want)|we\s+(bought|got|have)|please\s+add|add|buy|get)\s+/i, '');
  text = text.replace(/\b(a|one)\s+(kilo|kilogram|kg)\s+of\b/gi, '1 kg ');
  text = text.replace(/\b(\d+|[a-z]+)\s+(kilos|kilograms|kgs)\s+of\b/gi, '$1 kg ');
  text = text.replace(/\b(a|one)\s+(liter|litre|l)\s+of\b/gi, '1 L ');
  text = text.replace(/\b(\d+|[a-z]+)\s+(liters|litres|ls)\s+of\b/gi, '$1 L ');
  text = text.replace(/\b(a|one)\s+(loaf|pack|packet|box|bag)\s+of\b/gi, '1 pack ');
  text = text.replace(/\b(a|one)\s+bunch\s+of\b/gi, '1 bunch ');
  text = text.replace(/\b(a|one)\s+bottle\s+of\b/gi, '1 L ');
  text = text.replace(/\b(a|one)\s+carton\s+of\b/gi, '1 L ');
  text = text.replace(/\b(a|an)\s+dozen\b/gi, '12 pcs');
  text = text.replace(/\bhalf\s+a\s+(kilo|kg)\s+of\b/gi, '0.5 kg ');
  text = text.replace(/\bhalf\s+a\s+(liter|l)\s+of\b/gi, '0.5 L ');
  text = text.replace(/\bhalf\s+(a\s+)?dozen\b/gi, '6 pcs');

  // Convert spoken number words at beginning (e.g., "two liters milk" -> "2 liters milk")
  for (const [word, num] of Object.entries(SPOKEN_NUMBERS)) {
    const rx = new RegExp(`^${word}\\b`, 'i');
    if (rx.test(text)) {
      text = text.replace(rx, String(num));
      break;
    }
  }

  // Remove "of": e.g. "2 kg of tomatoes" -> "2 kg tomatoes"
  text = text.replace(/\b(kg|kilo|kilograms?|g|grams?|l|liters?|litres?|ml|gallons?|gal|lbs?|pounds?|oz|ounces?|pcs|pieces?|packs?|packet|bunches?|bunch)\s+of\b/gi, '$1 ');

  return text.trim();
}

/**
 * Parses full multi-item voice recordings or pasted grocery lists into structured item objects.
 * Handles compound sentences like:
 * "I bought 2 kg tomatoes, two liters of milk, and a pack of bread"
 */
export function parseMultiItemSpeechOrText(input = '') {
  if (!input || typeof input !== 'string') return [];

  let cleanInput = input.trim();
  cleanInput = cleanInput.replace(/^(i\s+(bought|got|have|purchased|need|want)|we\s+(bought|got|have)|please\s+add|add)\s+/i, '');

  // Protect common food conjunctions
  const compoundProtected = cleanInput
    .replace(/\b(salt\s+and\s+pepper)\b/gi, 'salt_and_pepper')
    .replace(/\b(macaroni\s+and\s+cheese)\b/gi, 'mac_and_cheese')
    .replace(/\b(fish\s+and\s+chips)\b/gi, 'fish_and_chips')
    .replace(/\b(peanut\s+butter\s+and\s+jelly)\b/gi, 'pb_and_j');

  // Split on commas, semicolons, newlines, or conjunction phrases
  const rawSegments = compoundProtected
    .split(/[,;\n]|\b(?:and\s+also|and\s+then|and|plus|as\s+well\s+as)\b/i)
    .map((s) => s.replace(/_/g, ' ').trim())
    .filter((s) => s.length > 1);

  const results = [];
  const seenNames = new Set();

  for (const seg of rawSegments) {
    const normalized = normalizeSpokenPhrase(seg);
    if (!normalized || normalized.length < 2) continue;

    const detected = detectFoodDetails(normalized);
    const parsedQty = parseQuantityAndUnit(normalized);

    let rawName = detected?.cleanName || detected?.parsedCleanName || parsedQty?.cleanName || normalized;
    rawName = rawName.replace(/^(a|an|some|the|of)\s+/i, '').trim();

    if (!rawName || rawName.length < 2) continue;

    // Capitalize words
    const displayName = rawName
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');

    const lowerKey = displayName.toLowerCase();
    if (seenNames.has(lowerKey)) continue;
    seenNames.add(lowerKey);

    const quantity = parsedQty?.quantity || detected?.quantity || 1;
    const unit = parsedQty?.unit || detected?.unit || detected?.defaultUnit || 'kg';
    const category = detected?.category || 'Vegetables';
    const track = detected?.track || (category === 'Pantry' ? 'pantry' : 'produce');
    const storageLocation = detected?.storageLocation || (track === 'pantry' ? 'pantry' : 'fridge');
    const shelfLifeDays = detected?.shelfLifeDays || (track === 'pantry' ? 60 : 5);

    results.push({
      id: `batch-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: displayName,
      quantity,
      unit,
      category,
      track,
      storageLocation,
      shelfLifeDays,
      pantryState: 'FULL',
    });
  }

  return results;
}

