import Layout from '../Components/layout/Layout'
import SearchUsers from '../Components/ui/SearchUsers'
import Profile from '../Components/ui/Profile';
import { useParams } from 'react-router-dom';

function Users() {
  const { id } = useParams();

  return (
    <Layout>
      <div className={`users-page ${id ? "users-page-selected" : ""}`}>
        <div className="users-search-page">
          <SearchUsers heading={"Find Users"} activeId={id} />
        </div>

        {id && (
          <div className="users-profile-page">
            <Profile id={id} />
          </div>
        )}
      </div>
    </Layout>
  )
}

export default Users
