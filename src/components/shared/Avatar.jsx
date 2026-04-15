export const Avatar = ({ src, username, size = 'md', className = '' }) => {
  const letter = username ? username[0].toUpperCase() : '?'
  return (
    <div className={`avatar avatar-${size} ${className}`}>
      {src ? <img src={src} alt={username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : letter}
    </div>
  )
}

export const UserCard = ({ user, onClick, showFollow, isFollowing, onFollow }) => (
  <div className="card flex items-center gap-2" style={{ cursor: onClick ? 'pointer' : 'default', padding: '12px 16px' }} onClick={onClick}>
    <Avatar src={user.avatar_url} username={user.username} size="md" />
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontWeight: 600, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>@{user.username}</div>
      {user.bio && <div style={{ fontSize: '0.75rem', color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.bio}</div>}
    </div>
    {showFollow && (
      <button className={`btn btn-sm ${isFollowing ? 'btn-ghost' : 'btn-primary'}`} onClick={e => { e.stopPropagation(); onFollow?.() }}>
        {isFollowing ? 'Unfollow' : 'Follow'}
      </button>
    )}
  </div>
)
