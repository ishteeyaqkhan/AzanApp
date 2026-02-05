import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Voices from './pages/Voices';
import Events from './pages/Events';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/voices"
          element={
            <PrivateRoute>
              <Layout>
                <Voices />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/events"
          element={
            <PrivateRoute>
              <Layout>
                <Events />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route path="/prayers" element={<Navigate to="/events" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
