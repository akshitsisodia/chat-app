import { FaBars } from 'react-icons/fa6'
import "../../Styles/Sidebar.css"

function Header({ show, setShow }) {
  // const menuClickedHandler = () => {
  //   document.getElementById('sidebar').style.transform = "translate(0px)"
  //   document.getElementById('darkBackground').style.display = "block"
  // }
  return (
    <header className="header">
      <button className="menu-bar" onClick={setShow}>
        <FaBars color='#fff' />
      </button>
      <h3 className="header-heading">
        <span className='sidebar-heading-logo' />
        <span className="aside-name">ChatApp</span>
      </h3>

    </header>
  )
}

export default Header