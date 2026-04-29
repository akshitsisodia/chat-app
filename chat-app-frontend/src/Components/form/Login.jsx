import { useState } from 'react'
import { getLoginMutation } from '../../Hooks/useAuthMutation'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [open, setOpen] = useState(false)

  const useLoginMutation = getLoginMutation({ password, setPassword, setEmail });

  if (useLoginMutation?.error) console.log(useLoginMutation?.failureReason?.response?.data?.message, useLoginMutation.error)



  const onSubmitHandler = (e) => {
    e.preventDefault();
    useLoginMutation.mutate({
      email,
      password
    })
  }

  function enableMedia() {
    if ("vibrate" in navigator) {
      navigator.vibrate(1); // tiny vibration to unlock permission
    }
  }

  return (


    <form className="auth-form" onSubmit={onSubmitHandler}>
      <label htmlFor="email">Email<span>*</span></label>
      <input name='email' type="email" value={email} onChange={e => setEmail(e.target.value)} className="auth-email-input" placeholder='Enter your email address' required />

      <label htmlFor="password">Password<span>*</span></label>
      <input name='password' type="password" value={password} onChange={e => setPassword(e.target.value)} className="auth-password-input" placeholder='Enter your password' required />

      <p className='formError'>{useLoginMutation?.failureReason?.response?.data?.message}</p>
      <button type='submit' className="auth-login-button" disabled={useLoginMutation.isPending}>{useLoginMutation.isPending ? <p className='loader' /> : "Sign in"}</button>
    </form>





  )
}

export default Login