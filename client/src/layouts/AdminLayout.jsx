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
      <header className="bg-black text-white p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold tracking-widest">ENNIGMA ADMIN</h1>
          <div className="space-x-4">
            <Link to="/" className="text-sm underline hover:text-gray-300">View Store</Link>
            <button onClick={handleLogout} className="text-sm text-red-400 hover:text-red-300 underline">Logout</button>
          </div>
        </div>
      </header>
      <div className="flex flex-1">
        <aside className="w-64 bg-white border-r border-gray-200 p-4">
          <nav className="space-y-2">
            <Link to="/admin" className="block py-2 px-4 hover:bg-gray-50 rounded">Dashboard</Link>
            <Link to="/admin/products" className="block py-2 px-4 hover:bg-gray-50 rounded">Products</Link>
            <Link to="/admin/orders" className="block py-2 px-4 hover:bg-gray-50 rounded">Orders</Link>
            <Link to="/admin/users" className="block py-2 px-4 hover:bg-gray-50 rounded font-medium text-black">Users</Link>
          </nav>
        </aside>
        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
export default AdminLayout;
