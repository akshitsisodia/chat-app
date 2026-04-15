
import GroupFilePreview from '../ui/GroupFilePreview'

function GroupFileList({ data, chatId, receiver, imageButtonClicked }) {
    return (
        <ul className="messages-media-list">
            {data.map((obj, i) => {
                return (
                    <li className="pdf-container" key={i}>
                        < GroupFilePreview file={obj} chatId={chatId} receiver={receiver} imageButtonClicked={imageButtonClicked} />
                    </li>
                )
            })}

        </ul>
    )
}

export default GroupFileList