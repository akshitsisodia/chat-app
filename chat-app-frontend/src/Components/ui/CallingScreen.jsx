import React, { useEffect, useMemo, useState } from 'react'
import { FaMicrophoneSlash, FaPhoneSlash, FaVideo, FaMicrophone, FaVideoSlash } from 'react-icons/fa'
import { FaUserPlus } from 'react-icons/fa6'
import { useCall } from '../../Context/CallContext'
import InviteMembersModal from '../model/InviteMembersModal.jsx'
import { CALL_STATE } from '../../config/callState'
import VideoPlayer from './VideoPlayer .jsx'

function CallingScreen({ isCalling = true, isVideoCall }) {
    const [elapsedSeconds, setElapsedSeconds] = useState(0)
    const {
        state,
        participants,

        localStream,
        remoteStreams,

        isMuted,
        toggleMute,
        toggleVideo,

        endCall,

        inviteUsersToCall,
        showInviteModal,
        setShowInviteModal,
    } = useCall()

    const remoteParticipantIds = useMemo(() => {
        const participantIds = (participants || [])
            .map(participant => typeof participant === 'object' ? participant?.id : participant)
            .filter(Boolean)
        const streamIds = Object.keys(remoteStreams || {})
        return [...new Set([...participantIds, ...streamIds])]
    }, [participants, remoteStreams])

    const tiles = useMemo(() => {
        const remoteTiles = remoteParticipantIds.map((id) => ({
            id,
            label: `User ${id?.slice ? id.slice(0, 8) : id}`,
            stream: remoteStreams?.[id],
            isLocal: false
        }))

        return [
            {
                id: 'local',
                label: 'You',
                stream: localStream,
                isLocal: true
            },
            ...remoteTiles
        ]
    }, [localStream, remoteParticipantIds, remoteStreams])

    const connected = state.status === CALL_STATE.CONNECTED || state.status === CALL_STATE.RECONNECTED
    const localVideoEnabled = localStream?.getVideoTracks().some(track => track.readyState === 'live' && track.enabled)

    useEffect(() => {
        if (!connected) return undefined

        const interval = setInterval(() => {
            setElapsedSeconds(prev => prev + 1)
        }, 1000)

        return () => clearInterval(interval)
    }, [connected])

    const formatTime = () => {
        const hours = Math.floor(elapsedSeconds / 3600)
        const minutes = Math.floor((elapsedSeconds % 3600) / 60)
        const seconds = elapsedSeconds % 60
        const parts = hours > 0 ? [hours, minutes, seconds] : [minutes, seconds]

        return parts.map(part => part.toString().padStart(2, '0')).join(':')
    }

    const statusText = connected ? formatTime() : isCalling ? 'Calling...' : 'Connecting...'


    const shouldShowVideo = (tile) => {
        if (!isVideoCall || !tile.stream) return false
        if (!tile.isLocal) return true

        return localVideoEnabled
    }

    return (
        <div className="calling-screen group-call-screen">
            <header className="group-call-header">
                {tiles.length > 2 && <div className="group-call-count">{tiles.length + " participants"}</div>}
                <span className="group-call-status">{statusText}</span>
            </header>

            <main className={`group-call-grid group-call-grid-${Math.min(tiles.length, 6)}`}>
                {tiles.map((tile) => (
                    <section className={`group-call-tile ${tile.isLocal ? 'local' : ''}`} key={tile.id}>
                        {shouldShowVideo(tile) ? (
                            <VideoPlayer stream={tile.stream} muted={tile.isLocal} />
                        ) : (
                            <div className="group-call-placeholder" aria-label={`${tile.label} audio only`}>
                                <div className="group-call-avatar">{tile.label.charAt(0).toUpperCase()}</div>
                            </div>
                        )}
                        <div className="group-call-tile-label">
                            <span>{tile.label}</span>
                            {tile.isLocal && isMuted && <span className="group-call-muted">Muted</span>}
                            {!tile.isLocal && !tile.stream && <span className="group-call-muted">Joining</span>}
                        </div>
                    </section>
                ))}
            </main>

            <footer className="group-call-controls">
                <button
                    className={`group-call-button ${isMuted ? 'active' : ''}`}
                    onClick={toggleMute}
                    title={isMuted ? 'Unmute' : 'Mute'}
                    type="button"
                >
                    <FaMicrophoneSlash />
                </button>

                {isVideoCall && (
                    <button
                        className={`group-call-button ${!localVideoEnabled ? 'active' : ''}`}
                        onClick={toggleVideo}
                        title={localVideoEnabled ? 'Stop video' : 'Start video'}
                        type="button"
                    >
                        {localVideoEnabled ? <FaVideo /> : <FaVideoSlash />}
                    </button>
                )}

                <button
                    className="group-call-button"
                    onClick={() => setShowInviteModal(true)}
                    title="Invite members"
                    type="button"
                >
                    <FaUserPlus />
                </button>



                <button
                    className="group-call-button end"
                    onClick={() => endCall('END')}
                    title="End call"
                    type="button"
                >
                    <FaPhoneSlash style={{ transform: "scaleX(-1)" }} />
                </button>
            </footer>

            {showInviteModal && (
                <InviteMembersModal
                    onClose={() => setShowInviteModal(false)}
                    onInvite={inviteUsersToCall}
                    currentParticipants={participants}
                />
            )}
        </div>
    )
}

export default CallingScreen
