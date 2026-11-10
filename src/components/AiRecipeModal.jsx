// src/components/AiRecipeModal.jsx
// Grovio "Rescue My Fridge" AI Recipe Generator
import React, { useState, useEffect } from 'react';
import {
  X,
  ChefHat,
  Loader2,
  Sparkles,
  Clock,
  Check,
  CheckCircle2,
  Copy,
  AlertTriangle,
  Plus,
  Flame,
  Leaf,
} from 'lucide-react';

const COMMON_PANTRY_STAPLES = [
  'Eggs',
  'Garlic',
  'Olive Oil',
  'Rice',
  'Bread',
  'Cheese',
  'Onions',
  'Pasta',
];

function RecipeCard({ recipe, index, onMarkCooked, isCooked }) {
  const [open, setOpen] = useState(index === 0);
  const [copied, setCopied] = useState(false);

  const handleCopy = (e) => {
    e.stopPropagation();
    const text = `${recipe.title}\n\nTime: ${recipe.cookTime || '15 mins'} | Difficulty: ${recipe.difficulty || 'Easy'}\n\nIngredients:\n${(recipe.ingredients || []).map((i) => `• ${i}`).join('\n')}\n\nInstructions:\n${(recipe.instructions || []).map((s, idx) => `${idx + 1}. ${s}`).join('\n')}`;
    navigator.clipboard?.writeText?.(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const difficultyColors = {
    Easy: { bg: '#dcfce7', text: '#15803d' },
    Medium: { bg: '#fef3c7', text: '#b45309' },
    Hard: { bg: '#fee2e2', text: '#b91c1c' },
  };

  const diffStyle = difficultyColors[recipe.difficulty] || difficultyColors.Easy;

  return (
    <div
      style={{
        border: open ? '1.5px solid #16a34a' : '1px solid #e2e8f0',
        borderRadius: 14,
        overflow: 'hidden',
        background: open ? '#fafffa' : '#ffffff',
        boxShadow: open ? '0 4px 14px rgba(22, 163, 74, 0.08)' : '0 1px 3px rgba(0, 0, 0, 0.02)',
        transition: 'all 0.2s ease',
      }}
    >
      {/* Header bar */}
      <div
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          gap: 12,
          userSelect: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
          <span
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              flexShrink: 0,
              background: '#dcfce7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 13,
              fontWeight: 800,
              color: '#166534',
            }}
          >
            {index + 1}
          </span>
          <div style={{ minWidth: 0 }}>
            <h4
              style={{
                fontSize: 14.5,
                fontWeight: 700,
                color: '#0f172a',
                margin: 0,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {recipe.title}
            </h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 3 }}>
              {recipe.cookTime && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#64748b' }}>
                  <Clock size={12} /> {recipe.cookTime}
                </span>
              )}
              {recipe.difficulty && (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 99,
                    background: diffStyle.bg,
                    color: diffStyle.text,
                  }}
                >
                  {recipe.difficulty}
                </span>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <button
            type="button"
            onClick={handleCopy}
            title="Copy Recipe"
            style={{
              padding: '6px 10px',
              borderRadius: 8,
              border: '1px solid #e2e8f0',
              background: '#ffffff',
              fontSize: 12,
              fontWeight: 600,
              color: '#475569',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            {copied ? <Check size={12} color="#16a34a" /> : <Copy size={12} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
          <span style={{ fontSize: 18, color: '#94a3b8', fontWeight: 600, width: 20, textAlign: 'center' }}>
            {open ? '−' : '+'}
          </span>
        </div>
      </div>

      {/* Expanded Details */}
      {open && (
        <div style={{ padding: '0 18px 18px', borderTop: '1px solid #f1f5f9' }}>
          {/* Ingredients list */}
          {recipe.ingredients?.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Required Ingredients
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {recipe.ingredients.map((ing, i) => (
                  <span
                    key={i}
                    style={{
                      fontSize: 12.5,
                      padding: '4px 10px',
                      borderRadius: 99,
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      color: '#334155',
                      fontWeight: 500,
                    }}
                  >
                    {ing}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Instructions */}
          {recipe.instructions?.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Step-by-Step Cooking Guide
              </p>
              <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 9 }}>
                {recipe.instructions.map((step, i) => (
                  <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        flexShrink: 0,
                        background: '#dcfce7',
                        border: '1px solid rgba(22, 163, 74, 0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 11,
                        fontWeight: 800,
                        color: '#15803d',
                        marginTop: 1,
                      }}
                    >
                      {i + 1}
                    </span>
                    <span style={{ fontSize: 13, color: '#1e293b', lineHeight: 1.55 }}>
                      {step}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Cooked & Consumed Button */}
          <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px dashed #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              disabled={isCooked}
              onClick={() => onMarkCooked && onMarkCooked(recipe)}
              style={{
                padding: '9px 18px',
                borderRadius: 99,
                border: 'none',
                background: isCooked ? '#f1f5f9' : '#166534',
                color: isCooked ? '#64748b' : '#ffffff',
                fontSize: 13,
                fontWeight: 700,
                cursor: isCooked ? 'default' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                transition: 'background 0.15s ease',
              }}
            >
              {isCooked ? (
                <>
                  <CheckCircle2 size={16} color="#16a34a" />
                  <span>Rescued & Consumed ✓</span>
                </>
              ) : (
                <>
                  <Flame size={15} />
                  <span>I Cooked This! Mark Items Consumed</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AiRecipeModal({
  isOpen = true,
  expiringItems = [],
  onClose,
  generateRecipeFn,
  onConsume,
}) {
  const [selectedItems, setSelectedItems] = useState([]);
  const [extraIngredients, setExtraIngredients] = useState([]);
  const [customInput, setCustomInput] = useState('');
  const [phase, setPhase] = useState('idle'); // 'idle' | 'loading' | 'done' | 'error'
  const [recipes, setRecipes] = useState([]);
  const [source, setSource] = useState('');
  const [errMsg, setErrMsg] = useState('');
  const [cookedSuccess, setCookedSuccess] = useState(false);

  // Initialize selected items from expiring items
  useEffect(() => {
    if (expiringItems && expiringItems.length > 0) {
      setSelectedItems(expiringItems.map((i) => i.name));
    } else {
      setSelectedItems(['Spinach', 'Bananas']);
    }
  }, [expiringItems]);

  // Trigger recipe generation
  const handleGenerate = async (itemsToUse) => {
    const list = itemsToUse || [...selectedItems, ...extraIngredients];
    if (list.length === 0) return;

    setPhase('loading');
    setErrMsg('');
    try {
      if (generateRecipeFn) {
        const res = await generateRecipeFn(list);
        const data = res.data || {};
        setRecipes(data.recipes || []);
        setSource(data.source || '');
        setPhase('done');
      } else {
        // Fallback demo recipes
        setTimeout(() => {
          setRecipes([
            {
              title: `15-Min Zero-Waste Sauté with ${list[0] || 'Veggies'}`,
              ingredients: [...list, 'Olive Oil', 'Garlic', 'Salt & Pepper'],
              instructions: [
                'Heat 1 tbsp olive oil in a skillet over medium heat.',
                'Sauté garlic for 30 seconds until aromatic.',
                `Add ${list.join(', ')} and toss for 4-5 minutes until tender.`,
                'Season with salt, pepper, and serve hot.',
              ],
              cookTime: '12 minutes',
              difficulty: 'Easy',
            },
          ]);
          setPhase('done');
        }, 600);
      }
    } catch {
      setErrMsg('Could not generate recipes right now. Please try again.');
      setPhase('error');
    }
  };

  // Run initial generation when modal opens
  useEffect(() => {
    if (isOpen) {
      const initial = expiringItems.length > 0 ? expiringItems.map((i) => i.name) : ['Spinach', 'Bananas'];
      handleGenerate(initial);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleSelectedItem = (name) => {
    setSelectedItems((prev) =>
      prev.includes(name) ? prev.filter((i) => i !== name) : [...prev, name]
    );
  };

  const toggleStaple = (staple) => {
    setExtraIngredients((prev) =>
      prev.includes(staple) ? prev.filter((i) => i !== staple) : [...prev, staple]
    );
  };

  const addCustomStaple = (e) => {
    e?.preventDefault();
    const trimmed = customInput.trim();
    if (trimmed && !extraIngredients.includes(trimmed)) {
      setExtraIngredients((prev) => [...prev, trimmed]);
      setCustomInput('');
    }
  };

  const handleMarkCooked = (recipe) => {
    if (onConsume && expiringItems.length > 0) {
      // Find matching items in expiring items that appear in the recipe or selected list
      const matched = expiringItems.filter((item) =>
        selectedItems.includes(item.name) ||
        (recipe.ingredients || []).some((ing) => ing.toLowerCase().includes(item.name.toLowerCase()))
      );

      matched.forEach((item) => {
        onConsume(item._id || item.id);
      });
    }
    setCookedSuccess(true);
    setTimeout(() => {
      setCookedSuccess(false);
    }, 4500);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(4px)',
        padding: 16,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 620,
          maxHeight: '90vh',
          background: '#ffffff',
          borderRadius: 20,
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.25)',
          border: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(to right, #fcfdfc, #f8fafc)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: '#dcfce7',
                color: '#166534',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ChefHat size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Rescue My Fridge
                </h2>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 99,
                    background: '#dcfce7',
                    color: '#166534',
                  }}
                >
                  Zero-Waste AI
                </span>
              </div>
              <p style={{ fontSize: 12.5, color: '#64748b', margin: '2px 0 0' }}>
                Cook with your soon-to-expire groceries before they go to waste
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: 'none',
              background: '#f8fafc',
              color: '#64748b',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {/* Success banner if cooked */}
          {cookedSuccess && (
            <div
              style={{
                marginBottom: 16,
                padding: '12px 16px',
                borderRadius: 12,
                background: '#dcfce7',
                border: '1px solid #bbf7d0',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <CheckCircle2 size={18} color="#166534" />
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#166534', margin: 0 }}>
                  Items Marked as Consumed!
                </p>
                <p style={{ fontSize: 12, color: '#15803d', margin: '2px 0 0' }}>
                  Great job reducing food waste! Your kitchen preservation score was updated.
                </p>
              </div>
            </div>
          )}

          {/* Expiring Ingredients selection */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 8 }}>
              Expiring Ingredients to Rescue
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {(expiringItems.length > 0 ? expiringItems : [
                { id: '1', name: 'Spinach', daysLeft: 1, status: 'urgent' },
                { id: '2', name: 'Bananas', daysLeft: 3, status: 'warn' },
              ]).map((item) => {
                const isSelected = selectedItems.includes(item.name);
                const isUrgent = item.status === 'urgent' || (item.daysLeft && item.daysLeft <= 1);
                return (
                  <button
                    key={item.id || item.name}
                    type="button"
                    onClick={() => toggleSelectedItem(item.name)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 99,
                      border: isSelected ? '1.5px solid #16a34a' : '1px solid #e2e8f0',
                      background: isSelected ? '#dcfce7' : '#f8fafc',
                      color: isSelected ? '#15803d' : '#64748b',
                      fontSize: 12.5,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {isSelected && <Check size={12} strokeWidth={3} />}
                    <span>{item.name}</span>
                    <span
                      style={{
                        fontSize: 11,
                        padding: '1px 6px',
                        borderRadius: 99,
                        background: isUrgent ? '#fee2e2' : '#fef3c7',
                        color: isUrgent ? '#ef4444' : '#d97706',
                        fontWeight: 700,
                      }}
                    >
                      {item.daysLeft ? `${item.daysLeft}d left` : 'Soon'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pantry staples tags */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 8 }}>
              Add Kitchen Staples
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
              {COMMON_PANTRY_STAPLES.map((staple) => {
                const isAdded = extraIngredients.includes(staple);
                return (
                  <button
                    key={staple}
                    type="button"
                    onClick={() => toggleStaple(staple)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 8,
                      border: isAdded ? '1px solid #16a34a' : '1px solid #e2e8f0',
                      background: isAdded ? '#f0fdf4' : '#ffffff',
                      color: isAdded ? '#166534' : '#475569',
                      fontSize: 12,
                      fontWeight: isAdded ? 700 : 500,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    {isAdded ? <Check size={11} strokeWidth={2.5} /> : <Plus size={11} />}
                    {staple}
                  </button>
                );
              })}

              {/* Custom staple input */}
              <form onSubmit={addCustomStaple} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <input
                  type="text"
                  placeholder="+ custom item"
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  style={{
                    padding: '4px 8px',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    fontSize: 12,
                    outline: 'none',
                    width: 100,
                  }}
                />
              </form>
            </div>
          </div>

          {/* Action trigger if selections changed */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <button
              type="button"
              disabled={phase === 'loading' || selectedItems.length === 0}
              onClick={() => handleGenerate()}
              style={{
                padding: '9px 20px',
                borderRadius: 10,
                border: 'none',
                background: '#166534',
                color: '#ffffff',
                fontSize: 13,
                fontWeight: 700,
                cursor: phase === 'loading' ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              {phase === 'loading' ? (
                <>
                  <Loader2 size={15} className="spin-animate" />
                  <span>Thinking up rescue recipes…</span>
                </>
              ) : (
                <>
                  <Sparkles size={15} />
                  <span>Generate New Recipes</span>
                </>
              )}
            </button>

            {source && (
              <span style={{ fontSize: 12, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Leaf size={12} color="#16a34a" />
                {source === 'gemini' ? 'Crafted with Gemini AI' : 'Zero-Waste Chef Library'}
              </span>
            )}
          </div>

          {/* Loading state */}
          {phase === 'loading' && (
            <div style={{ textAlign: 'center', padding: '36px 0' }}>
              <div
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: '50%',
                  border: '3px solid #e2e8f0',
                  borderTopColor: '#16a34a',
                  margin: '0 auto 14px',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
              <p style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', margin: 0 }}>
                Designing Quick 15-Minute Meals…
              </p>
              <p style={{ fontSize: 12.5, color: '#64748b', margin: '4px 0 0' }}>
                Prioritizing expiring ingredients to save food and reduce waste
              </p>
            </div>
          )}

          {/* Error state */}
          {phase === 'error' && (
            <div
              style={{
                padding: '14px 18px',
                borderRadius: 12,
                background: '#fee2e2',
                border: '1px solid #fca5a5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={16} color="#dc2626" />
                <span style={{ fontSize: 13, color: '#b91c1c', fontWeight: 600 }}>{errMsg}</span>
              </div>
              <button
                type="button"
                onClick={() => handleGenerate()}
                style={{
                  padding: '4px 10px',
                  borderRadius: 6,
                  border: 'none',
                  background: '#ffffff',
                  color: '#dc2626',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Retry
              </button>
            </div>
          )}

          {/* Recipe list */}
          {phase === 'done' && recipes.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {recipes.map((recipe, idx) => (
                <RecipeCard
                  key={idx}
                  recipe={recipe}
                  index={idx}
                  onMarkCooked={handleMarkCooked}
                  isCooked={cookedSuccess}
                />
              ))}
            </div>
          )}

          {phase === 'done' && recipes.length === 0 && (
            <div style={{ textAlign: 'center', padding: '36px 0', color: '#64748b' }}>
              <span style={{ fontSize: 32 }}>🍳</span>
              <p style={{ fontSize: 14, fontWeight: 600, marginTop: 8 }}>No recipes generated for this combination</p>
              <p style={{ fontSize: 12.5 }}>Try adding common pantry staples like Eggs, Rice, or Olive Oil</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
