import { Navigate } from "react-router-dom";
import { useAuth } from "../Context/AuthContext"
import Loading from "../Components/ui/Loading";
import Error from "../Components/ui/Error";

function ProtectedRoute({ children }) {
    const { me, isLoading, error } = useAuth();

    if (isLoading) return <Loading margin={true} />

    if (!me) {
        return <Navigate to="/auth" replace />;
    }

    if (error) return <Error error={error} />

    return children
}

export default ProtectedRoute