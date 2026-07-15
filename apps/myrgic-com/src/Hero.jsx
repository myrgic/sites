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
      <p style={heroStyles.essence}>Distilling <a className="book-link" href="https://book.myrgic.com">distinction</a>,<br/>from datacenter to desktop</p>
      <p className="tagline" style={{ marginTop: 16 }}>Local-first AI infrastructure</p>
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
  essence: {
    fontFamily: 'var(--font-display)',
    fontWeight: 400,
    color: 'var(--fg-2)',
    fontSize: 'clamp(19px, 3vw, 27px)',
    letterSpacing: '-0.01em',
    lineHeight: 1.35,
    fontVariationSettings: "'opsz' 40, 'SOFT' 50",
    margin: '22px 0 0',
  },
};

window.MyHero = MyHero;
