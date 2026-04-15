import React from 'react'
import Model from './Model'
import SearchUsers from '../ui/SearchUsers'

function SelectUsersModel({ onClose, setMembers, memberIds }) {
    return (
        <Model onClose={onClose}>
            <SearchUsers select={"select"} setMembers={setMembers} memberIds={memberIds} />
        </Model>
    )
}

export default SelectUsersModel