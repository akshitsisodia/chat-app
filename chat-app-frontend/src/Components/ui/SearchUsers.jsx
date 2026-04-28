import "../../Styles/Ui.css"
import Search from "../filters/Search"
import { useQuery } from "@tanstack/react-query";
import { getAllUsers } from "../../Services/userAPI";
import UsersList from "../common/UsersList";
import { useDebounce } from "../../Hooks/useDebounce";
import useQueryParams from "../../Hooks/useQueryParams";
import Pagination from "../filters/Pagination";
import Loading from "./Loading";
import { FaTriangleExclamation, FaUserPlus, FaUsers } from "react-icons/fa6";

function SearchUsers({ heading, select, memberIds, setMembers, activeId }) {
    const { getParams, setParams } = useQueryParams();

    const search = getParams("search", "")
    const page = Number(getParams("page", 1));
    // const sort = getParams("sort", "")
    // const order = getParams("order", "")

    const limit = 6;

    const debounceData = useDebounce(search, 800);

    const { data, isLoading, error } = useQuery({
        queryKey: ["users", debounceData, page, limit
            //  sort, order,
        ],
        queryFn: ({ signal }) =>
            getAllUsers({
                search: debounceData.toLowerCase(),
                page,
                limit,
                // sort,
                // order,
                signal
            })
        ,
        keepPreviousData: true
    })

    const users = data?.data ?? []
    const total = data?.total ?? 0
    const totalPages = Math.ceil(total / limit)
    const selectedMemberIds = memberIds?.map(curr => typeof curr === "object" ? curr.id : curr) ?? [];
    const isSelecting = Boolean(select);
    const title = heading || (isSelecting ? "Select users" : "Find users");

    // Handlers 
    const searchHandlers = (e) => {
        setParams({
            search: e.target.value,
            page: 1
        })
    }
    const onPageChange = (p) => {
        setParams({
            page: p
        });
    };

    return (
        <div className={`search-users ${isSelecting ? "search-users-select" : ""}`}>
            <div className="search-users-main">
                <div className="search-users-header">
                    <span className="search-users-icon">
                        {isSelecting ? <FaUserPlus /> : <FaUsers />}
                    </span>
                    <div>
                        <h1 className="users-heading">{title}</h1>
                        <p>{isSelecting ? "Search and add people to this conversation." : "Search people and start a private chat."}</p>
                    </div>
                </div>
                <Search search={search} setSearch={searchHandlers} />
            </div>
            <div className="userList-container">
                {isLoading && <Loading />}
                {!isLoading && error && (
                    <div className="search-users-state">
                        <FaTriangleExclamation />
                        <h3>Could not load users</h3>
                        <p className="muted">Please try again in a moment.</p>
                    </div>
                )}
                {!isLoading && !error && users.length === 0 && (
                    <div className="search-users-state">
                        <FaUsers />
                        <h3>No users found</h3>
                        <p className="muted">{search ? "Try a different name or email." : "Users will appear here when available."}</p>
                    </div>
                )}
                {!isLoading && !error && users.length > 0 && (
                    <>
                        <UsersList data={users} select={select} setMembers={setMembers} memberIds={selectedMemberIds} activeId={activeId} />
                        <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
                    </>
                )}
            </div>
        </div>
    )
}

export default SearchUsers
