import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router'
import { Index } from '~/routes/Index'
import './index.css'

createRoot(document.getElementById('root') as HTMLElement).render(
  <BrowserRouter>
    <Routes>
      <Route index element={<Index />} />
    </Routes>
  </BrowserRouter>
)
