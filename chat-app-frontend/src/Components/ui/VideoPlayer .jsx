import React, { useEffect, useRef } from 'react'

const VideoPlayer = React.memo(({ stream, muted = false }) => {
    const videoRef = useRef(null);

    useEffect(() => {
        if (!videoRef.current || !stream) return;

        videoRef.current.srcObject = stream;
    }, [stream]);

    return (
        <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={muted}
        />
    );
});

export default VideoPlayer 