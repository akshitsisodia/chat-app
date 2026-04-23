
import FilePreview from '../ui/FilePreview'

function FilesList({ data, public_key, imageButtonClicked }) {
    return (
        <ul className="messages-media-list">
            {data.map((obj, i) => {
                return (
                    <div className="pdf-container" key={i}>
                        < FilePreview file={obj} senderPublicKey={public_key} imageButtonClicked={imageButtonClicked} />
                    </div>
                )
            })}

        </ul>
    )
}

export default FilesList