import { Route, Routes } from 'react-router-dom'
import './Styles/App.css'
import PreviousChats from './Pages/PreviousChats'
import Users from './Pages/Users'
import SingleUser from './Pages/SingleUser'
import PrivateMessages from './Pages/PrivateMessages'
import ProtectedRoute from './Routes/ProtectedRoute'
import Auth from './Pages/Auth'


function App() {

  return (
    <Routes>

      <Route path='/auth' element={<Auth />} />
      <Route path='/' element={
        <ProtectedRoute>
          <PreviousChats />
        </ProtectedRoute>
      } />
      <Route path='/users' element={
        <ProtectedRoute>
          <Users />
        </ProtectedRoute>
      } />
      <Route path='/users/:id' element={
        <ProtectedRoute>
          <SingleUser />
        </ProtectedRoute>
      } />
      <Route path='/:id' element={
        <ProtectedRoute>
          <PrivateMessages />
        </ProtectedRoute>
      } />

    </Routes>
  )
}

export default App
