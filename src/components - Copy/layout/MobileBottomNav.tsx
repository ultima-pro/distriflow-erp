import React from 'react';
import { useErp, ErpTab } from '../../context/ErpContext';
import { LayoutDashboard, ShoppingCart, PlusCircle, Store, MoreHorizontal } from 'lucide-react';

interface MobileBottomNavProps {
  onOpenMenu: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ onOpenMenu }) => {
  const { activeTab, setActiveTab } = useErp();

  const isMainTab = (tab: ErpTab) => activeTab === tab;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1 shadow-lg flex items-center justify-around safe-area-bottom">
      <button
        onClick={() => setActiveTab('dashboard')}
        className={`flex flex-col items-center justify-center p-1.5 min-w-[56px] min-h-[48px] rounded-xl transition-colors ${
          isMainTab('dashboard') ? 'text-blue-600 font-bold' : 'text-slate-500'
        }`}
      >
        <LayoutDashboard className="w-5 h-5" />
        <span className="text-[10px] mt-0.5">Home</span>
      </button>

      <button
        onClick={() => setActiveTab('orders')}
        className={`flex flex-col items-center justify-center p-1.5 min-w-[56px] min-h-[48px] rounded-xl transition-colors ${
          isMainTab('orders') ? 'text-blue-600 font-bold' : 'text-slate-500'
        }`}
      >
        <ShoppingCart className="w-5 h-5" />
        <span className="text-[10px] mt-0.5">Orders</span>
      </button>

      {/* Central Highlighted "+ Order" Button */}
      <button
        onClick={() => setActiveTab('new-order')}
        className="flex flex-col items-center justify-center -mt-4 bg-gradient-to-tr from-blue-700 to-blue-500 text-white p-2.5 rounded-full shadow-lg shadow-blue-500/30 active:scale-95 transition-transform min-w-[52px] min-h-[52px]"
        aria-label="New Order"
      >
        <PlusCircle className="w-6 h-6" />
      </button>

      <button
        onClick={() => setActiveTab('retailers')}
        className={`flex flex-col items-center justify-center p-1.5 min-w-[56px] min-h-[48px] rounded-xl transition-colors ${
          isMainTab('retailers') ? 'text-blue-600 font-bold' : 'text-slate-500'
        }`}
      >
        <Store className="w-5 h-5" />
        <span className="text-[10px] mt-0.5">Retailers</span>
      </button>

      <button
        onClick={onOpenMenu}
        className="flex flex-col items-center justify-center p-1.5 min-w-[56px] min-h-[48px] rounded-xl text-slate-500 hover:text-slate-800 transition-colors"
      >
        <MoreHorizontal className="w-5 h-5" />
        <span className="text-[10px] mt-0.5">Menu</span>
      </button>
    </nav>
  );
};
