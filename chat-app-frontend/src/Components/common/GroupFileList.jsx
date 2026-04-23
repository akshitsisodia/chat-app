
import GroupFilePreview from '../ui/GroupFilePreview'

function GroupFileList({ data, groupKey, imageButtonClicked }) {
    return (
        <ul className="messages-media-list">
            {data.map((obj, i) => {
                return (
                    <li className="pdf-container" key={i}>
                        < GroupFilePreview file={obj} groupKey={groupKey} imageButtonClicked={imageButtonClicked} />
                    </li>
                )
            })}

        </ul>
    )
}

export default GroupFileList