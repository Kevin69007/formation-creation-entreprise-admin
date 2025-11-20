export const dynamic = 'force-dynamic'

export default function Home() {
  return (
    <div style={{ padding: '40px', fontFamily: 'system-ui', textAlign: 'center' }}>
      <h1>Formation Entreprise API</h1>
      <p>Backend API - Version 1.0.0</p>
      <div style={{ marginTop: '20px', textAlign: 'left', display: 'inline-block' }}>
        <h2>Endpoints disponibles :</h2>
        <ul>
          <li><code>/api/auth/login</code></li>
          <li><code>/api/auth/register</code></li>
          <li><code>/api/auth/me</code></li>
          <li><code>/api/users</code></li>
          <li><code>/api/users/[username]</code></li>
          <li><code>/api/users/[username]/profile</code></li>
          <li><code>/api/progress</code></li>
        </ul>
      </div>
    </div>
  )
}

