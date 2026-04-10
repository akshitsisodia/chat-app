import nacl from "tweetnacl";
import * as util from "tweetnacl-util";

import '../../Styles/Auth.css'
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa'
import { useRef, useState } from 'react'
import { getOtpMutation, getRegisterMutation, getVerifyMutation } from '../../Hooks/useAuthMutation'
import { encryptPrivateKey } from "../../Hooks/usePrivateKeyEncryption";
import Loading from "../ui/Loading";

function Register({ isNext, setNext, isContinue, setContinue, }) {
  const [message, setMessage] = useState("")
  const [error, setError] = useState("") //pass & confirmPass Error

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [conPassword, setConPassword] = useState("")

  //otp ref
  const input1Ref = useRef(null);
  const input2Ref = useRef(null);
  const input3Ref = useRef(null);
  const input4Ref = useRef(null);

  const useOtpMutation = getOtpMutation({ setNext, setEmail, setName });
  const useVerifyMutation = getVerifyMutation({ setContinue, setMessage });
  const useRegisterMutation = getRegisterMutation({ setPassword, setConPassword });


  const nextClickedHandler = (e) => {
    e.preventDefault()
    useOtpMutation.mutate({
      name,
      email
    })
  }

  const continueClickedHandler = (e) => {
    e.preventDefault()
    const otp = input1Ref.current.value + input2Ref.current.value + input3Ref.current.value + input4Ref.current.value;
    useVerifyMutation.mutate({
      email: localStorage.getItem("verificationEmail"),
      otp
    })

  }

  const handleChange = (e, nextRef) => {
    const value = e.target.value;
    // Allow only digits
    if (/^\d?$/.test(value)) {
      e.target.value = value;
      if (value.length === 1 && nextRef) {
        nextRef.current.focus();
      }
    }
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();

    if (password !== conPassword) {
      setError(`"Password" and "Confirm Password" must be same!`);
      setPassword("")
      setConPassword("")
      return
    }

    // Generate Keys for ETEE 
    const keyPair = nacl.box.keyPair();

    const publicKey = util.encodeBase64(keyPair.publicKey);
    const privateKey = util.encodeBase64(keyPair.secretKey);

    const encryptedData = await encryptPrivateKey(privateKey, password);

    // store privateKey
    localStorage.setItem("privateKey", privateKey);

    useRegisterMutation.mutate({
      email: localStorage.getItem("verificationEmail"),
      password,
      publicKey,
      encryptedPrivateKey: encryptedData.encryptedPrivateKey,
      salt: encryptedData.salt,
      iv: encryptedData.iv
    })
  }

  return (
    <>
      {/* get name & email  */}
      {!isNext && !isContinue &&
        <form className="auth-form" onSubmit={nextClickedHandler}>
          <label htmlFor="name">Name<span>*</span></label>
          <input name='name' type="text" value={name} onChange={(e) => setName(e.target.value)} className="auth-name-input" placeholder='Enter your name' required />

          <label htmlFor="email">Email<span>*</span></label>
          <input name='email' type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="auth-email-input" placeholder='Enter your email address' required />
          <p className='formError'>{useOtpMutation?.failureReason?.response?.data?.message}</p>
          <button type='submit' className="auth-login-button">{useOtpMutation.isPending ? <div className="loader"></div> : "Next"}<FaArrowRight /></button>
        </form>

      }

      {/* verify otp  */}
      {isNext && !isContinue && <>
        <h2 className="auth-greetings">Verify Email</h2>
        <p className="auth-sub-greetings">{message}</p>
        <form className="auth-form" onSubmit={continueClickedHandler}>
          <label htmlFor="otp">Enter OTP<span>*</span></label>
          <div className="otp-inputs" >
            <input name='otp' type="String" ref={input1Ref} onChange={(e) => handleChange(e, input2Ref)} required maxLength="1" pattern="\d*" inputMode="numeric" className='otpInput' />
            <input name='otp' type="String" ref={input2Ref} onChange={(e) => handleChange(e, input3Ref)} required maxLength="1" pattern="\d*" inputMode="numeric" className='otpInput' />
            <input name='otp' type="String" ref={input3Ref} onChange={(e) => handleChange(e, input4Ref)} required maxLength="1" pattern="\d*" inputMode="numeric" className='otpInput' />
            <input name='otp' type="String" ref={input4Ref} onChange={(e) => handleChange(e, null)} required maxLength="1" pattern="\d*" inputMode="numeric" className='otpInput' />
          </div>
          <p className='formError'>{useVerifyMutation?.failureReason?.response?.data?.message}</p>

          <p className="auth-sub-greetings">OTP is valid for two minutes.</p>

          <button type='submit' className="auth-login-button" >{useVerifyMutation.isPending ? <div className="loader"></div> : "Verify"}<FaArrowRight /></button>
        </form>
      </>}

      {/* get password  */}
      {isNext && isContinue && <>
        <h2 className="auth-greetings">Create Password</h2>

        <form className="auth-form" onSubmit={onSubmitHandler}>

          <label htmlFor="password">Password<span>*</span></label>
          <input name='password' type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder='Enter your password' required />

          <label htmlFor="confirmPassword">Confirm password<span>*</span></label>
          <input name='confirmPassword' type="password" value={conPassword} onChange={(e) => setConPassword(e.target.value)} placeholder='Enter your password' required />

          <p className='formError'>{error}</p>
          <p className='formError'>{useRegisterMutation?.failureReason?.response?.data?.message}</p>

          <div className="flex">
            <button type='submit' className="auth-login-button">{useRegisterMutation.isPending ? <div className="loader"></div> : "Continue"}<FaArrowRight /></button>
          </div>
        </form>
      </>}
    </>

  )
}

export default Register