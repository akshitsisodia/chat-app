import { Navigate } from "react-router-dom";
import { useAuth } from "../Context/AuthContext"
import Loading from "../Components/ui/Loading";
import Error from "../Components/ui/Error";
import { useSocket } from "../Context/SocketContext";

function ProtectedRoute({ children }) {
    const { me, isLoading, error } = useAuth();
    const { socket } = useSocket();



    if (isLoading) return <Loading margin={true} />

    if (!me) {
        return <Navigate to="/auth" replace />;
    }

    if (!socket) return <Loading margin={true} />
    if (error) return <Error error={error} />
    /* Cookie is shared across origins that use the same API, but privateKey is per-origin.
       Do not call server logout here — it would kill the deployment session and could crash
       if logout onSuccess failed. Send user to auth to sign in again on this origin. */
    const privateKey = localStorage.getItem("privateKey");
    if (!privateKey) {
        return <Navigate to="/auth" replace state={{ missingPrivateKey: true }} />;
    }

    return children
}

export default ProtectedRoute