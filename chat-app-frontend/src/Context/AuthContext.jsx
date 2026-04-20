import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createContext, useContext, useEffect } from 'react'
import { getMe } from '../Services/userAPI'
import { useNavigate } from 'react-router-dom'
import { logoutUser } from '../Services/authAPI'
// import { connectSocket } from '../Lib/socket'
import { getLogoutMutation } from '../Hooks/useAuthMutation'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const { data, isLoading, error } = useQuery({
        queryKey: ["me"],
        queryFn: getMe,
        retry: false,
        refetchOnWindowFocus: false
    })

    const me = data?.data ?? undefined

    // useEffect(() => {
    //     connectSocket();
    // }, [])

    const login = async () => {
        navigate("/")
        await queryClient.refetchQueries({ queryKey: ["me"] })
        // connectSocket();
    }


    const logoutMutation = getLogoutMutation();
    const logout = () => {
        logoutMutation.mutate()
    }

    return (
        <AuthContext.Provider value={{ me, isLoading, error, login, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)