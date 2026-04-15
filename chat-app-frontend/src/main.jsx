import { createRoot } from 'react-dom/client'
import './Styles/index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './Context/AuthContext.jsx'
import { ChatsProvider } from './Context/ChatsContext.jsx'

const queryClient = new QueryClient();

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ChatsProvider>
          <App />
        </ChatsProvider>
      </AuthProvider>
    </QueryClientProvider>
  </BrowserRouter>
)
