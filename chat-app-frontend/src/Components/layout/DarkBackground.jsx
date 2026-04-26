import React from 'react'

function DarkBackground({ show, setShow }) {
    const buttonClickedHandler = () => {
        document.getElementById("sidebar").style.transform = "translate(-260px)"
        document.getElementById("darkBackground").style.display = "none"
    }
    return (
        <button type='button' className={show ? "darkBackground" : ""} id='darkBackground' onClick={setShow}></button>
    )
}

export default DarkBackground