import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

// SVG Icon Components
const Icons = {
  Dashboard: ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
  ),
  Users: ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
  ),
  Teachers: ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
  ),
  Marks: ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
  ),
  Reports: ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
  ),
  Assessments: ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 3v18h18"/><rect width="4" height="7" x="7" y="10" rx="1"/><rect width="4" height="12" x="15" y="5" rx="1"/></svg>
  ),
  Analytics: ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
  ),
  Settings: ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.35a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
  ),
  Menu: ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
  ),
  ChevronLeft: ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m15 18-6-6 6-6"/></svg>
  ),
  X: ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
  )
};

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // Close mobile sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const navItems = [
    { path: '/', label: 'Dashboard', icon: Icons.Dashboard },
    { path: '/students', label: 'Students', icon: Icons.Users },
    { path: '/teachers', label: 'Teachers', icon: Icons.Teachers },
    { path: '/marks', label: 'Marks Entry', icon: Icons.Marks },
    { path: '/reports', label: 'Reports', icon: Icons.Reports },
    { path: '/assessments', label: 'Assessments', icon: Icons.Assessments },
    { path: '/analytics', label: 'Analytics', icon: Icons.Analytics },
    { path: '/settings', label: 'Settings', icon: Icons.Settings },
  ];

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/40 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside 
        className={`
          fixed md:static inset-y-0 left-0 z-50 bg-white border-r border-gray-200 
          flex flex-col sidebar-transition
          ${sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0 md:shadow-none'}
          ${collapsed ? 'md:w-20' : 'md:w-64'}
          w-64
        `}
      >
        {/* Sidebar Header */}
        <div className={`h-16 flex items-center px-4 border-b border-gray-100 bg-white ${collapsed ? 'justify-center' : 'justify-between'}`}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-sm shadow-primary-200">
              B
            </div>
            {!collapsed && (
              <span className="font-bold text-gray-800 text-lg tracking-tight whitespace-nowrap">
                Broadway
              </span>
            )}
          </div>
          {/* Mobile Close Button */}
          <button 
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-1 text-gray-500 hover:bg-gray-100 rounded-md transition-colors"
          >
            <Icons.X className="w-6 h-6" />
          </button>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                title={collapsed ? item.label : ''}
                className={`
                  flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 group relative
                  ${isActive 
                    ? 'bg-primary-50 text-primary-700 font-medium shadow-sm shadow-primary-100' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }
                  ${collapsed ? 'justify-center' : ''}
                `}
              >
                <item.icon className={`w-5 h-5 flex-shrink-0 transition-colors ${isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                
                {!collapsed && (
                  <span className="ml-3 text-sm whitespace-nowrap">
                    {item.label}
                  </span>
                )}
                
                {/* Active Indicator for Collapsed Mode */}
                {collapsed && isActive && (
                  <div className="absolute left-0 w-1 h-6 bg-primary-600 rounded-r-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
            {!collapsed ? (
                <div className="text-xs text-gray-400 text-center flex flex-col gap-1">
                    <span className="font-medium text-gray-500">Version 1.3</span>
                    <span>Offline Ready</span>
                </div>
            ) : (
                <div className="text-xs text-gray-400 text-center font-bold">v1.3</div>
            )}
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-gray-50">
        
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-6 shadow-sm z-20">
          <div className="flex items-center gap-4">
            {/* Mobile Toggle */}
            <button 
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Icons.Menu className="w-6 h-6" />
            </button>
            
            {/* Desktop Collapse Toggle */}
            <button 
              onClick={() => setCollapsed(!collapsed)}
              className="hidden md:flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
              title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              <Icons.Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb / Page Title */}
            <div className="hidden sm:flex items-center">
              <div className="h-5 w-px bg-gray-200 mx-3"></div>
              <span className="text-sm font-medium text-gray-700">
                {navItems.find(i => i.path === location.pathname)?.label || 'Dashboard'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end hidden sm:flex">
               <span className="text-sm font-semibold text-gray-700 leading-none mb-1">Admin User</span>
               <span className="text-xs text-gray-500 leading-none">Headteacher</span>
            </div>
            <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold border border-primary-200 shadow-sm">
              AU
            </div>
          </div>
        </header>

        {/* Scrollable Main Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth bg-gray-50/50">
           <div className={`max-w-7xl mx-auto transition-all duration-300 ${collapsed ? 'max-w-[1600px]' : ''}`}>
              {children}
           </div>
        </main>
      </div>
    </div>
  );
};