import '../Styles/Auth.css'

import { NavLink, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { FaApple } from 'react-icons/fa'

import Login from '../Components/form/Login'
import Register from '../Components/form/Register'

import authDecoration from '../assets/authDecorationGif.gif'
import googleLogo from '../assets/icon-google.png'
import { useAuth } from '../Context/AuthContext'


function Auth() {
    const { me } = useAuth()
    const navigate = useNavigate();

    useEffect(() => {
        const privateKey = localStorage.getItem("privateKey");
        if (me && privateKey) {
            navigate("/", { replace: true });
        }
    }, [me, navigate]);

    const [open, setOpen] = useState(false)
    const [isNext, setNext] = useState(false)
    const [isContinue, setContinue] = useState(false)

    const signClickedHandler = () => {
        document.getElementById("auth-fill").style.transform = "translateX(135px)"
        setOpen(true)
    }
    const logClickedHandler = () => {
        document.getElementById("auth-fill").style.transform = "translateX(0px)"
        setOpen(false)

    }

    return (
        <main className='auth'>
            <section className="auth-section">
                <p className="logo"><span className='sidebar-heading-logo' />ChatApp</p>

                <div className="auth-content">

                    {!isNext &&
                        <>
                            <h2 className="auth-greetings">Welcome to ChatApp</h2>
                            <p className="auth-sub-greetings">Start your experience with ChatApp by signing in or signing up.</p>

                            <div className="auth-change-buttons">
                                <span className='auth-go-button-fill' id='auth-fill'></span>
                                <button className={"auth-go-button"} onClick={logClickedHandler}>Sign in</button>
                                <button className={"auth-go-button"} onClick={signClickedHandler}>Sign up</button>
                            </div>
                        </>
                    }

                    {!open && <Login />}

                    {open && <Register isNext={isNext} setNext={setNext} isContinue={isContinue} setContinue={setContinue} />}

                    {/* {!isNext &&
                        <>
                            <div className="auth-divider"> or </div>
                            <div className="auth-OAuth-buttons">
                                <button type='button' className="auth-google-button" >
                                    <img src={googleLogo} alt="google" width={20} />
                                </button>
                                <button type='button' className="auth-google-button">
                                    <FaApple />
                                </button>
                            </div>
                        </>
                    } */}

                </div>


                <p className="auth-bottom">Copyright: ChatApp, All right reserved &nbsp;<NavLink>Term & Condition</NavLink>&nbsp; |&nbsp; <NavLink>Privacy & Policy</NavLink></p>
            </section>
            <section className="auth-decoration-section">
                <img src={authDecoration} alt="image" />
                <h2 className='auth-decoration-heading'>find & connect with </h2>
                <h2 className='auth-decoration-heading'>people across the world</h2>
                <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Molestias porro nemo adipisci illo dolores nisi unde impedit cupiditate.</p>
            </section>
        </main>
    )
}

export default Auth