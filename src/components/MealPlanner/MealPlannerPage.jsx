// src/components/MealPlanner/MealPlannerPage.jsx
// Weekly Family Meal Planner with Smart Inventory Deduction & Auto Shopping List Sync

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Utensils,
  Plus,
  AlertCircle,
  ShoppingCart,
  ChefHat,
  Trash2,
  Flame,
  Check,
} from 'lucide-react';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MEAL_SLOTS = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];

const PRESET_RECIPES = [
  {
    name: 'Garden Vegetable Omelette',
    slot: 'Breakfast',
    prepTime: '12 mins',
    ingredients: ['Eggs', 'Spinach', 'Tomato', 'Onion'],
  },
  {
    name: 'Strawberry Banana Oatmeal',
    slot: 'Breakfast',
    prepTime: '8 mins',
    ingredients: ['Oats', 'Milk', 'Banana', 'Strawberries'],
  },
  {
    name: 'Creamy Garlic Pasta',
    slot: 'Lunch',
    prepTime: '20 mins',
    ingredients: ['Pasta', 'Garlic', 'Milk', 'Cheese', 'Olive Oil'],
  },
  {
    name: 'Fresh Salad Bowl',
    slot: 'Lunch',
    prepTime: '10 mins',
    ingredients: ['Cucumber', 'Tomato', 'Lemon', 'Olive Oil'],
  },
  {
    name: 'Fragrant Basmati & Veggie Curry',
    slot: 'Dinner',
    prepTime: '30 mins',
    ingredients: ['Basmati Rice', 'Potato', 'Carrot', 'Onion', 'Garlic'],
  },
  {
    name: 'Paneer / Tofu Stir-Fry',
    slot: 'Dinner',
    prepTime: '22 mins',
    ingredients: ['Paneer', 'Capsicum', 'Onion', 'Ginger', 'Garlic'],
  },
];

export default function MealPlannerPage({ store }) {
  const [activeDay, setActiveDay] = useState(DAYS_OF_WEEK[0]);
  const [mealPlan, setMealPlan] = useState(() => {
    try {
      const saved = localStorage.getItem('grovio_meal_plan');
      if (saved) return JSON.parse(saved);
    } catch {}
    // Default starter plan
    return {
      Monday: {
        Breakfast: { name: 'Garden Vegetable Omelette', ingredients: ['Eggs', 'Spinach', 'Tomato'] },
        Lunch: { name: 'Fresh Salad Bowl', ingredients: ['Cucumber', 'Tomato', 'Lemon'] },
        Dinner: { name: 'Fragrant Basmati & Veggie Curry', ingredients: ['Basmati Rice', 'Potato', 'Onion'] },
      },
      Tuesday: {
        Breakfast: { name: 'Strawberry Banana Oatmeal', ingredients: ['Milk', 'Banana', 'Strawberries'] },
        Dinner: { name: 'Paneer / Tofu Stir-Fry', ingredients: ['Paneer', 'Capsicum', 'Onion'] },
      },
      Wednesday: {
        Lunch: { name: 'Creamy Garlic Pasta', ingredients: ['Pasta', 'Garlic', 'Milk'] },
      },
    };
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState('Dinner');
  const [customName, setCustomName] = useState('');
  const [customIngs, setCustomIngs] = useState('');

  // Persist meal plan
  useEffect(() => {
    try {
      localStorage.setItem('grovio_meal_plan', JSON.stringify(mealPlan));
    } catch {}
  }, [mealPlan]);

  // Inventory matching helper
  const inventoryItemNames = (store.items || []).map((i) => (i.name || '').toLowerCase());

  const checkIngredientInStock = (ingName) => {
    const clean = (ingName || '').toLowerCase().trim();
    return inventoryItemNames.some((n) => n.includes(clean) || clean.includes(n));
  };

  // Find missing ingredients for a meal
  const getMissingIngredientsForMeal = (meal) => {
    if (!meal?.ingredients) return [];
    return meal.ingredients.filter((ing) => !checkIngredientInStock(ing));
  };

  // Calculate all missing ingredients across the entire week
  const allMissingIngredients = [];
  Object.values(mealPlan).forEach((dayPlan) => {
    Object.values(dayPlan || {}).forEach((meal) => {
      const missing = getMissingIngredientsForMeal(meal);
      missing.forEach((m) => {
        if (!allMissingIngredients.includes(m)) {
          allMissingIngredients.push(m);
        }
      });
    });
  });

  // 1-Click Sync Missing Ingredients to Shopping List
  const handleSyncToShoppingList = async () => {
    if (allMissingIngredients.length === 0) {
      store.pushNotif('All meal plan ingredients are already in your kitchen stock! 🎉', 'success');
      return;
    }

    let addedCount = 0;
    for (const ing of allMissingIngredients) {
      await store.addNoteManual({
        name: ing,
        category: 'Meal Plan',
        isBought: false,
        targetPanel: 'PRODUCE',
      });
      addedCount++;
    }

    store.pushNotif(`Synced ${addedCount} missing ingredients to Shopping List! 🛒`, 'success');
  };

  // Cook Meal: Deduct available ingredients from kitchen stock
  const handleCookMeal = (meal) => {
    if (!meal?.ingredients) return;
    const consumed = [];

    meal.ingredients.forEach((ing) => {
      const clean = ing.toLowerCase().trim();
      const matched = (store.items || []).find((item) => {
        const itemLower = (item.name || '').toLowerCase();
        return itemLower.includes(clean) || clean.includes(itemLower);
      });
      if (matched) {
        store.markConsumed(matched.id);
        consumed.push(matched.name);
      }
    });

    if (consumed.length > 0) {
      store.pushNotif(`Cooked "${meal.name}"! Consumed ${consumed.length} ingredients from pantry. 🍳`, 'success');
    } else {
      store.pushNotif(`Cooked "${meal.name}"!`, 'success');
    }
  };

  // Remove a meal from slot
  const handleRemoveMeal = (day, slot) => {
    setMealPlan((prev) => {
      const next = { ...prev };
      if (next[day]) {
        delete next[day][slot];
      }
      return next;
    });
  };

  // Add meal
  const handleAddMeal = (recipe) => {
    const meal = recipe || {
      name: customName.trim() || 'Delicious Meal',
      ingredients: customIngs
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    };

    setMealPlan((prev) => ({
      ...prev,
      [activeDay]: {
        ...(prev[activeDay] || {}),
        [selectedSlot]: meal,
      },
    }));

    setShowAddModal(false);
    setCustomName('');
    setCustomIngs('');
    store.pushNotif(`Added ${meal.name} to ${activeDay} ${selectedSlot}!`, 'success');
  };

  const dayMeals = mealPlan[activeDay] || {};

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Banner */}
      <div
        style={{
          background: 'var(--surface, #ffffff)',
          border: '1px solid var(--border, #e5e9f0)',
          borderRadius: '18px',
          padding: '24px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
              }}
            >
              <ChefHat size={22} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: 'var(--text, #1e293b)' }}>
                Weekly Meal Plan & Smart Sync
              </h1>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted, #64748b)' }}>
                Plan your family meals, auto-detect ingredients in your pantry, and 1-click sync missing items.
              </p>
            </div>
          </div>
        </div>

        {/* Action Button: Smart Sync to Shopping List */}
        <button
          onClick={handleSyncToShoppingList}
          style={{
            padding: '12px 20px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #10b981, #047857)',
            color: '#fff',
            border: 'none',
            fontSize: '13.5px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
            transition: 'transform 0.15s ease',
          }}
        >
          <ShoppingCart size={17} />
          Sync Missing Ingredients to List
          {allMissingIngredients.length > 0 && (
            <span
              style={{
                background: '#fef08a',
                color: '#854d0e',
                fontSize: '11px',
                padding: '2px 7px',
                borderRadius: '999px',
                fontWeight: 800,
              }}
            >
              {allMissingIngredients.length} missing
            </span>
          )}
        </button>
      </div>

      {/* Days of Week Navigation Pills */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '4px',
        }}
        className="scrollbar-none"
      >
        {DAYS_OF_WEEK.map((d) => {
          const isActive = d === activeDay;
          const count = Object.keys(mealPlan[d] || {}).length;
          return (
            <button
              key={d}
              onClick={() => setActiveDay(d)}
              style={{
                padding: '10px 18px',
                borderRadius: '12px',
                border: isActive ? '1px solid #10b981' : '1px solid var(--border, #e2e8f0)',
                background: isActive ? '#10b981' : 'var(--surface, #ffffff)',
                color: isActive ? '#ffffff' : 'var(--text, #334155)',
                fontWeight: 700,
                fontSize: '13.5px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
                boxShadow: isActive ? '0 4px 12px rgba(16, 185, 129, 0.25)' : 'none',
              }}
            >
              <Calendar size={15} />
              {d}
              {count > 0 && (
                <span
                  style={{
                    padding: '2px 6px',
                    borderRadius: '8px',
                    fontSize: '11px',
                    background: isActive ? 'rgba(255,255,255,0.25)' : 'var(--bg-muted, #f1f5f9)',
                    color: isActive ? '#fff' : 'var(--text-muted, #64748b)',
                  }}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Meal Slots Matrix for Selected Day */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        {MEAL_SLOTS.map((slot) => {
          const meal = dayMeals[slot];
          const missing = meal ? getMissingIngredientsForMeal(meal) : [];
          const hasIngredients = meal?.ingredients && meal.ingredients.length > 0;
          const allInStock = hasIngredients && missing.length === 0;

          return (
            <div
              key={slot}
              style={{
                background: 'var(--surface, #ffffff)',
                border: '1px solid var(--border, #e5e9f0)',
                borderRadius: '16px',
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '220px',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.02)',
              }}
            >
              <div>
                {/* Slot Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span
                    style={{
                      fontSize: '11.5px',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: 'var(--text-muted, #64748b)',
                    }}
                  >
                    {slot}
                  </span>
                  {meal && (
                    <button
                      onClick={() => handleRemoveMeal(activeDay, slot)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        padding: '4px',
                        borderRadius: '6px',
                      }}
                      title="Remove meal"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>

                {/* Meal Content or Empty State */}
                {meal ? (
                  <div>
                    <h3 style={{ margin: '0 0 10px', fontSize: '16px', fontWeight: 700, color: 'var(--text, #0f172a)' }}>
                      {meal.name}
                    </h3>

                    {/* Ingredients Checklist with In-Stock Status */}
                    {hasIngredients && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
                        {meal.ingredients.map((ing) => {
                          const inStock = checkIngredientInStock(ing);
                          return (
                            <span
                              key={ing}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '11px',
                                fontWeight: 600,
                                padding: '3px 8px',
                                borderRadius: '6px',
                                background: inStock ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                                color: inStock ? '#059669' : '#b45309',
                                border: inStock ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(245, 158, 11, 0.25)',
                              }}
                            >
                              {inStock ? <Check size={11} /> : <AlertCircle size={11} />}
                              {ing}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '24px 0',
                      color: 'var(--text-muted, #94a3b8)',
                    }}
                  >
                    <Utensils size={28} style={{ opacity: 0.35, marginBottom: '8px' }} />
                    <p style={{ margin: 0, fontSize: '13px' }}>No meal planned</p>
                  </div>
                )}
              </div>

              {/* Bottom Slot Action Buttons */}
              <div>
                {meal ? (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleCookMeal(meal)}
                      style={{
                        flex: 1,
                        padding: '9px',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        color: '#fff',
                        border: 'none',
                        fontWeight: 700,
                        fontSize: '12.5px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                      }}
                    >
                      <Flame size={14} /> Cook & Deduct
                    </button>
                    {missing.length > 0 && (
                      <button
                        onClick={async () => {
                          for (const m of missing) {
                            await store.addNoteManual({ name: m, category: 'Meal Plan', isBought: false });
                          }
                          store.pushNotif(`Added missing items for ${meal.name} to shopping list!`, 'success');
                        }}
                        style={{
                          padding: '9px 12px',
                          borderRadius: '10px',
                          background: 'rgba(245, 158, 11, 0.12)',
                          color: '#b45309',
                          border: '1px solid rgba(245, 158, 11, 0.3)',
                          fontWeight: 700,
                          fontSize: '12px',
                          cursor: 'pointer',
                        }}
                        title="Add missing items to shopping list"
                      >
                        + Add {missing.length} Missing
                      </button>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setSelectedSlot(slot);
                      setShowAddModal(true);
                    }}
                    style={{
                      width: '100%',
                      padding: '9px',
                      borderRadius: '10px',
                      border: '1px dashed var(--border, #cbd5e1)',
                      background: 'transparent',
                      color: 'var(--text-muted, #64748b)',
                      fontWeight: 600,
                      fontSize: '12.5px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    <Plus size={15} /> Plan {slot}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Choose Recipe Modal */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(5, 10, 20, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '560px',
              background: 'var(--surface, #ffffff)',
              border: '1px solid var(--border, #e5e9f0)',
              borderRadius: '20px',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '18px 22px',
                borderBottom: '1px solid var(--border, #e5e9f0)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: 'var(--text, #1e293b)' }}>
                  Plan {activeDay} • {selectedSlot}
                </h3>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted, #64748b)' }}>
                  Pick from pantry-tested recipes or create your own custom meal.
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '70vh', overflowY: 'auto' }}>
              {/* Presets List */}
              <div>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted, #64748b)', textTransform: 'uppercase' }}>
                  Popular Family Recipes
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                  {PRESET_RECIPES.map((rec) => {
                    const missing = getMissingIngredientsForMeal(rec);
                    return (
                      <div
                        key={rec.name}
                        onClick={() => handleAddMeal(rec)}
                        style={{
                          padding: '12px 14px',
                          borderRadius: '12px',
                          border: '1px solid var(--border, #e2e8f0)',
                          background: 'var(--bg-muted, #f8fafc)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div>
                          <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--text, #1e293b)' }}>
                            {rec.name}
                          </h4>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted, #64748b)' }}>
                            {rec.ingredients.join(', ')} • {rec.prepTime}
                          </span>
                        </div>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: missing.length === 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                            color: missing.length === 0 ? '#059669' : '#b45309',
                          }}
                        >
                          {missing.length === 0 ? '✓ In Pantry' : `${missing.length} missing`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Custom meal section */}
              <div style={{ borderTop: '1px solid var(--border, #e2e8f0)', paddingTop: '16px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted, #64748b)', textTransform: 'uppercase' }}>
                  Or Enter Custom Meal
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
                  <input
                    type="text"
                    placeholder="Meal name (e.g. Avocado Toast & Chai)"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid var(--border, #cbd5e1)',
                      fontSize: '13px',
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Comma-separated ingredients (e.g. Bread, Avocado, Milk, Tea)"
                    value={customIngs}
                    onChange={(e) => setCustomIngs(e.target.value)}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid var(--border, #cbd5e1)',
                      fontSize: '13px',
                    }}
                  />
                  <button
                    onClick={() => handleAddMeal()}
                    disabled={!customName.trim()}
                    style={{
                      padding: '11px',
                      borderRadius: '10px',
                      background: customName.trim() ? '#10b981' : '#94a3b8',
                      color: '#fff',
                      border: 'none',
                      fontWeight: 700,
                      cursor: customName.trim() ? 'pointer' : 'not-allowed',
                    }}
                  >
                    Add Custom Meal to {activeDay}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
