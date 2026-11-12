// src/App.jsx
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Layout/Sidebar';
import NotificationStack from './components/Layout/NotificationStack';
import OfflineBanner from './components/Layout/OfflineBanner';
import PwaInstallBanner from './components/Layout/PwaInstallBanner';
import DashboardView from './components/Dashboard/DashboardView';
import InventoryPage from './components/Inventory/InventoryPage';
import RestockPage from './components/Restock/RestockPage';
import MealPlannerPage from './components/MealPlanner/MealPlannerPage';
import InsightsPage from './components/Analytics/InsightsPage';
import SettingsPage from './components/Settings/SettingsPage';
import AuthPage from './components/Auth/AuthPage';
import MorningDigestModal from './components/Notifications/MorningDigestModal';
import AiRecipeModal from './components/AiRecipeModal';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useGroceryStore } from './store/useGroceryStore';
import { applyTheme } from './store/useSettings';
import { checkMorningDigestEligible, sendDesktopAlert } from './utils/notifications';

// Bootstrap persisted theme before first render
(function () {
  try {
    const s = JSON.parse(localStorage.getItem('grovio_settings') || '{}');
    if (s.themeId) applyTheme(s.themeId);
    else applyTheme('minimalist');
  } catch {}
})();

function MainDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showAuthView, setShowAuthView] = useState(false);
  const [showMorningDigest, setShowMorningDigest] = useState(false);
  const [digestData, setDigestData] = useState(null);
  const [rescueRecipeModalItems, setRescueRecipeModalItems] = useState(null);

  const { user, isAuthenticated, isGuest } = useAuth();
  const store = useGroceryStore(user?.id);

  // Proactive check on app load for morning expiration digest
  useEffect(() => {
    if (store.items && store.items.length > 0) {
      const eligible = checkMorningDigestEligible(store.items);
      if (eligible) {
        setDigestData(eligible);
        setShowMorningDigest(true);
        if (eligible.expiringProduce.length > 0) {
          sendDesktopAlert(
            'Grovio Morning Alert 🌿',
            `${eligible.expiringProduce.length} item(s) nearing expiry (${eligible.expiringProduce.map((i) => i.name).slice(0, 2).join(', ')}). Cook a 15-min rescue meal today!`
          );
        }
      }
    }
  }, [store.items]);

  // Handler to manually open morning digest
  const handleOpenMorningDigest = () => {
    const data = checkMorningDigestEligible(store.items) || {
      expiringProduce: store.items.filter((i) => (i.track === 'produce' || i.panelType === 'PRODUCE') && i.status === 'active').slice(0, 2),
      lowPantry: store.items.filter((i) => (i.track === 'pantry' || i.panelType === 'PANTRY') && (i.pantryState === 'LOW' || i.stockLevel === 'LOW')),
    };
    setDigestData(data);
    setShowMorningDigest(true);
  };

  // If user is not authenticated and hasn't chosen guest mode, present the Login/Sign-up page
  if (!isAuthenticated && !isGuest) {
    return <AuthPage onSuccess={() => setActiveTab('dashboard')} />;
  }

  // If user clicked "Sign In" while browsing in guest mode
  if (showAuthView) {
    return (
      <div style={{ position: 'relative' }}>
        <button
          type="button"
          onClick={() => setShowAuthView(false)}
          style={{
            position: 'absolute',
            top: 20,
            left: 20,
            zIndex: 50,
            padding: '8px 14px',
            borderRadius: 8,
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            color: '#64748b',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          ← Return to Grovio
        </button>
        <AuthPage onSuccess={() => setShowAuthView(false)} />
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg, #f8fafc)',
        color: 'var(--text, #0f172a)',
        display: 'flex',
      }}
    >
      {/* Left Sidebar Navigation (Images 2, 3, 4, 5) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAuth={() => setShowAuthView(true)}
      />

      {/* Main Content Area */}
      <main
        style={{
          flex: 1,
          minWidth: 0,
          padding: '28px 36px 64px',
          overflowY: 'auto',
          boxSizing: 'border-box',
          background: 'var(--bg, #f8fafc)',
          color: 'var(--text, #0f172a)',
        }}
      >
        {activeTab === 'dashboard' && (
          <DashboardView
            items={store.items}
            notes={store.notes}
            wasteLog={store.wasteLog}
            onAdd={store.addItem}
            onAddMultiple={store.addItems}
            onConsume={store.markConsumed}
            onWaste={store.markWasted}
            onDelete={store.deleteItem}
            onNavigateTab={setActiveTab}
            generateRecipeFn={store.generateRecipeFn}
            onOpenMorningDigest={handleOpenMorningDigest}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryPage
            items={store.items}
            onAdd={store.addItem}
            onConsume={store.markConsumed}
            onWaste={store.markWasted}
            onDelete={store.deleteItem}
            onUpdate={store.updateItem}
            onTogglePantry={store.togglePantryState}
            onAddToRestock={store.addToRestock}
            generateRecipeFn={store.generateRecipeFn}
            onOpenMorningDigest={handleOpenMorningDigest}
          />
        )}

        {activeTab === 'shopping' && (
          <RestockPage
            notes={store.notes}
            items={store.items}
            onBuy={store.buyNote}
            onToggleCheck={store.toggleNoteCheck}
            onMoveToInventory={store.moveNoteToInventory}
            onMoveAllChecked={store.moveAllCheckedToInventory}
            onAddNote={store.addNoteManual}
            onDeleteNote={store.deleteNote}
            onAddGrocery={store.addItem}
            onNavigateTab={setActiveTab}
            onOpenRescueRecipes={(items) => setRescueRecipeModalItems(items)}
            onOpenMorningDigest={handleOpenMorningDigest}
          />
        )}

        {activeTab === 'planner' && (
          <MealPlannerPage store={store} />
        )}

        {activeTab === 'insights' && (
          <InsightsPage
            items={store.items}
            wasteLog={store.wasteLog}
            onRefresh={store.refreshAll}
            onOpenRescueRecipes={(items) => setRescueRecipeModalItems(items)}
            onOpenMorningDigest={handleOpenMorningDigest}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsPage
            onOpenAuth={() => setShowAuthView(true)}
            store={store}
          />
        )}
      </main>

      <NotificationStack
        notifications={store.notifications}
        dismiss={store.dismissNotif}
      />

      <OfflineBanner />
      <PwaInstallBanner />

      {/* ── Morning Kitchen Expiration Digest Modal ──────────────────────── */}
      {showMorningDigest && (
        <MorningDigestModal
          isOpen={showMorningDigest}
          onClose={() => setShowMorningDigest(false)}
          expiringProduce={digestData?.expiringProduce || []}
          lowPantry={digestData?.lowPantry || []}
          onOpenRecipes={(expItems) => {
            setRescueRecipeModalItems(expItems);
          }}
          onAddNotes={(noteData) => {
            store.addNoteManual(noteData);
          }}
        />
      )}

      {/* ── Direct AI Recipe Rescue Modal from Bell or Digest ────────────── */}
      {rescueRecipeModalItems && (
        <AiRecipeModal
          isOpen={Boolean(rescueRecipeModalItems)}
          onClose={() => setRescueRecipeModalItems(null)}
          expiringItems={rescueRecipeModalItems}
          generateRecipeFn={store.generateRecipeFn}
          onConsume={store.markConsumed}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainDashboard />
    </AuthProvider>
  );
}
