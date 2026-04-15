import '../../Styles/Model.css'
import { FaXmark } from 'react-icons/fa6'

function Model({ onClose, children }) {
    return (
        <div className="model">
            <div className="model-children">
                <button type="button" className="model-button-close" onClick={onClose}>
                    <FaXmark color='#000' />
                </button>
                {children}
            </div>
        </div>
    )
}

export default Model