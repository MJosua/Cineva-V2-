import { Outlet, Link, useNavigate } from 'react-router-dom';
import { HelpCircle, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PublicCMSLayout = () => {
  const isLoggedIn = !!localStorage.getItem('hots_tokek');
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Minimal Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group transition-all">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center group-hover:bg-blue-700 transition-colors">
              <span className="text-white font-bold text-xs">H</span>
            </div>
            <span className="font-bold text-slate-800 tracking-tight">HOTS Help Center</span>
          </Link>
          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <Button 
                variant="ghost" 
                onClick={() => navigate(-1)} 
                className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 transition-all p-0 h-auto hover:bg-transparent"
              >
                <ChevronLeft className="w-4 h-4" />
                Back to HOTS
              </Button>
            ) : (
              <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors px-4 py-2 rounded-lg hover:bg-slate-50">Sign In</Link>
            )}
          </div>
        </div>
      </header>

      {/* Content Area */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="bg-white border-t border-slate-200 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm text-slate-400">© 2026 PT INDOFOOD CBP SUKSES MAKMUR - International Operations Division</p>
        </div>
      </footer>
    </div>
  );
};

export default PublicCMSLayout;
