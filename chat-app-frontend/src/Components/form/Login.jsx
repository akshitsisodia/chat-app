import { useState } from 'react'
import { getLoginMutation } from '../../Hooks/useAuthMutation'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [open, setOpen] = useState(false)

  const useLoginMutation = getLoginMutation({ password, setPassword, setEmail });

  if (useLoginMutation?.error) console.log(useLoginMutation?.failureReason?.response?.data?.message)



  const onSubmitHandler = (e) => {
    e.preventDefault();
    useLoginMutation.mutate({
      email,
      password
    })
  }

  return (


    <form className="auth-form" onSubmit={onSubmitHandler}>
      {/* <label htmlFor="name">Name</label> */}
      {/* <input name='name' type="text" className="auth-name-input" placeholder='Enter your name' required /> */}

      <label htmlFor="email">Email<span>*</span></label>
      <input name='email' type="email" value={email} onChange={e => setEmail(e.target.value)} className="auth-email-input" placeholder='Enter your email address' required />

      <label htmlFor="password">Password<span>*</span></label>
      <input name='password' type="password" value={password} onChange={e => setPassword(e.target.value)} className="auth-password-input" placeholder='Enter your password' required />

      <p className='formError'>{useLoginMutation?.failureReason?.response?.data?.message}</p>
      <button type='submit' className="auth-login-button">Sign in</button>
    </form>





  )
}

export default Login