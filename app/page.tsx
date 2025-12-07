import ForestScene from '@/components/ForestScene';

export default function HomePage() {
  return (
    <main className="page">
      <section className="hero">
        <div className="badge">Three.js + Next.js</div>
        <h1>Chop-n-Bike</h1>
        <p>
          A web-based 3D platformer with procedural forest terrain, over-the-shoulder camera,
          and a chop mechanic for clearing trees. Works on desktop (keyboard + mouse) and mobile
          (touch controls).
        </p>
        <div className="cta-row">
          <span className="cta">Click the scene and start moving</span>
          <span className="hint">WASD/Arrows to move · Space to jump · K to chop · Mouse to look</span>
        </div>
      </section>

      <section className="cards">
        <article className="card">
          <h2>World</h2>
          <p>Procedural forest with clearings, a circular mountain barrier, and soft volumetric fog.</p>
          <ul>
            <li>Walkable ground with visible paths and tree groupings.</li>
            <li>Mountains ring the arena; the goal exit sits along the ridge.</li>
            <li>Dynamic lighting to keep depth and mood.</li>
          </ul>
        </article>
        <article className="card">
          <h2>Player & Camera</h2>
          <p>Stick-figure placeholder with third-person camera offset over the shoulder.</p>
          <ul>
            <li>Keyboard: WASD/Arrows to move, Space to jump, K to swing sword.</li>
            <li>Mouse: click canvas to lock cursor; move to rotate camera.</li>
            <li>Mobile: touch D-pad for movement, Jump and Chop buttons on the right.</li>
          </ul>
        </article>
        <article className="card">
          <h2>Loop & Testing</h2>
          <p>Use the embedded scene to validate interactions before expanding mechanics.</p>
          <ul>
            <li>Run <code>npm run dev</code> for hot reload development.</li>
            <li>Use <code>npm run lint</code> to catch TypeScript/React issues.</li>
            <li>Hit <code>npm run build</code> to verify production readiness.</li>
          </ul>
        </article>
      </section>

      <ForestScene />
    </main>
  );
}
