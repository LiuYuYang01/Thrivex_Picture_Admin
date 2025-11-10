import { BrowserRouter, Routes, Route } from 'react-router';
import Home from '@/pages/home';

export default () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
};
