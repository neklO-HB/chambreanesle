import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import NotFound from './pages/NotFound';
import RoomPage from './pages/RoomPage';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="chambres/:slug" element={<RoomPage />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
