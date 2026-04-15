import "../../Styles/Ui.css"
import Search from "../filters/Search"
import { useQuery } from "@tanstack/react-query";
import { getAllUsers } from "../../Services/userAPI";
import UsersList from "../common/UsersList";
import { useDebounce } from "../../Hooks/useDebounce";
import useQueryParams from "../../Hooks/useQueryParams";
import Pagination from "../filters/Pagination";
import Loading from "./Loading";

function SearchUsers({ heading, select, memberIds, setMembers }) {
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

    // Handlers 
    const searchHandlers = (e) => {
        setParams({
            search: e.target.value
        })
    }
    const onPageChange = (p) => {
        setParams({
            page: p
        });
    };

    return (
        <div className="search-users">
            <div className="search-users-main">
                <h1 className="users-heading">{heading}</h1>
                <Search search={search} setSearch={searchHandlers} />
            </div>
            <div className="userList-container">
                {isLoading && <Loading />}
                {!isLoading && !error && <UsersList data={users} select={select} setMembers={setMembers} memberIds={memberIds}/>}
                {!isLoading && !error && <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />}
            </div>


        </div>
    )
}

export default SearchUsers