import { Outlet, Link, Navigate, useNavigate } from 'react-router-dom';

const AdminLayout = () => {
  const token = localStorage.getItem('adminToken');
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminInfo');
    navigate('/admin/login');
  };

  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <header className="bg-black text-white p-3 sm:p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-sm sm:text-xl font-bold tracking-widest truncate">ENNIGMA ADMIN</h1>
          <div className="space-x-3 sm:space-x-4 flex-shrink-0">
            <Link to="/" className="text-xs sm:text-sm underline hover:text-gray-300">View Store</Link>
            <button onClick={handleLogout} className="text-xs sm:text-sm text-red-400 hover:text-red-300 underline cursor-pointer">Logout</button>
          </div>
        </div>
      </header>
      <div className="flex flex-col md:flex-row flex-1">
        <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-gray-200 p-2 sm:p-4">
          <nav className="flex md:flex-col gap-1 sm:gap-2 overflow-x-auto pb-1 md:pb-0 text-xs sm:text-sm">
            <Link to="/admin" className="whitespace-nowrap py-1.5 sm:py-2 px-3 sm:px-4 hover:bg-gray-50 rounded font-medium text-gray-700 hover:text-black">Dashboard</Link>
            <Link to="/admin/appearance" className="whitespace-nowrap py-1.5 sm:py-2 px-3 sm:px-4 hover:bg-gray-50 rounded font-medium text-gray-700 hover:text-black flex items-center justify-between">
              <span>Appearance</span>
              <span className="text-[10px] bg-black text-white px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ml-1">New</span>
            </Link>
            <Link to="/admin/products" className="whitespace-nowrap py-1.5 sm:py-2 px-3 sm:px-4 hover:bg-gray-50 rounded font-medium text-gray-700 hover:text-black">Products</Link>
            <Link to="/admin/orders" className="whitespace-nowrap py-1.5 sm:py-2 px-3 sm:px-4 hover:bg-gray-50 rounded font-medium text-gray-700 hover:text-black">Orders</Link>
            <Link to="/admin/users" className="whitespace-nowrap py-1.5 sm:py-2 px-3 sm:px-4 hover:bg-gray-50 rounded font-medium text-gray-700 hover:text-black">Users</Link>
          </nav>
        </aside>
        <main className="flex-1 p-3 sm:p-8 overflow-x-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
export default AdminLayout;
