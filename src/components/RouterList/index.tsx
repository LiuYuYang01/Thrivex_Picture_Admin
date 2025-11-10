import { BrowserRouter, Routes, Route } from 'react-router';
import Layout from '@/pages/layout';
import Home from '@/pages/home';

export default () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};
