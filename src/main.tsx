import { createRoot } from 'react-dom/client';
import { HeroUIProvider } from '@heroui/react';
import RouterList from '@/components/RouterList';
import './styles/global.css';

const app = createRoot(document.getElementById('root')!);
app.render(
  <HeroUIProvider>
    <RouterList />
  </HeroUIProvider>
);
