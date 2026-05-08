// Hero — full-viewport mark playing the emergence, wordmark below, tagline below.
// v0.0.1 of myrgic.com — adapted from canonical brand-site. Scroll prompt removed
// since this page has no further sections yet. Iterate after domain-loop closure.
function MyHero() {
  return (
    <section style={heroStyles.hero}>
      <div style={heroStyles.markWrap}>
        <canvas
          ref={el => el && !el.dataset.bound && (el.dataset.bound = '1', window.createTrefoilMark(el, { emergence: true }))}
          width="1080" height="1080"
          style={{ width: '100%', height: '100%', display: 'block' }}
        />
      </div>
      <h1 className="wordmark" style={{ fontSize: 'clamp(56px, 11vw, 96px)', margin: '32px 0 0' }}>myrgic</h1>
      <p className="tagline" style={{ marginTop: 18 }}>thinking through distinction</p>
    </section>
  );
}

const heroStyles = {
  hero: {
    minHeight: '100vh',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    padding: '64px 32px', textAlign: 'center',
  },
  markWrap: {
    width: 'min(48vmin, 420px)',
    aspectRatio: 1,
  },
};

window.MyHero = MyHero;
