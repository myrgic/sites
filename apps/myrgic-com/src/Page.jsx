// Page — renders the Hero only. The sections below the hero (what Myrgic is,
// CogOS, mod3, repos, contact) live as static HTML directly in index.html,
// not here, so they render with no JS: a crawler or JS-less visitor still
// sees real content. Only the hero's animated mark needs the React/Babel
// CDN path. If MyPage ever needs to compose more than the Hero, keep that
// no-JS guarantee in mind before moving content back into JSX.
function MyPage() {
  return <MyHero />;
}

window.MyPage = MyPage;
