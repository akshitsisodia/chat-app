import { Route, Routes } from 'react-router-dom'
import './Styles/App.css'
import PreviousChats from './Pages/PreviousChats'
import Users from './Pages/Users'
import PrivateMessages from './Pages/PrivateMessages'
import ProtectedRoute from './Routes/ProtectedRoute'
import Auth from './Pages/Auth'
import UserGroups from './Pages/UserGroups'
import UserGroupRoom from './Pages/UserGroupRoom'
import CreateGroup from './Pages/CreateGroup'
import ChatProfile from './Pages/ChatProfile'
import SingleUser from './Pages/SingleUser'


function App() {

  return (
    <Routes>

      <Route path='/auth' element={<Auth />} />

      {/* <Route path='/update-photo' element={
        <ProtectedRoute>
          <UpdatePhoto />
        </ProtectedRoute>
      } /> */}

      <Route path='/' element={
        <ProtectedRoute>
          <PreviousChats />
        </ProtectedRoute>
      } />
      <Route path='/chats/:id' element={
        <ProtectedRoute>
          <ChatProfile />
        </ProtectedRoute>
      } />

      <Route path='/my-groups' element={
        <ProtectedRoute>
          <UserGroups />
        </ProtectedRoute>
      } />

      <Route path='/my-groups/:id' element={
        <ProtectedRoute>
          <UserGroupRoom />
        </ProtectedRoute>
      } />
      <Route path='/create-group' element={
        <ProtectedRoute>
          <CreateGroup />
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
