import { lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { AuthProvider } from "./services/auth";
import { ErrorBoundary } from "./components/ui";
import Layout from "./components/Layout";
const Home = lazy(() => import("./pages/Home"));
const Discover = lazy(() =>
  import("./pages/Learning").then((m) => ({ default: m.Discover })),
);
const TopicHub = lazy(() =>
  import("./pages/Learning").then((m) => ({ default: m.TopicHub })),
);
const Learn = lazy(() =>
  import("./pages/Learning").then((m) => ({ default: m.Learn })),
);
const PathPage = lazy(() =>
  import("./pages/Learning").then((m) => ({ default: m.PathPage })),
);
const LessonPage = lazy(() =>
  import("./pages/Learning").then((m) => ({ default: m.LessonPage })),
);
const Labs = lazy(() =>
  import("./pages/Lab").then((m) => ({ default: m.Labs })),
);
const LabPage = lazy(() =>
  import("./pages/Lab").then((m) => ({ default: m.LabPage })),
);
const Community = lazy(() =>
  import("./pages/Community").then((m) => ({ default: m.Community })),
);
const PostPage = lazy(() =>
  import("./pages/Community").then((m) => ({ default: m.PostPage })),
);
const Copilot = lazy(() => import("./pages/Copilot"));
const LoginPage = lazy(() =>
  import("./pages/Account").then((m) => ({ default: m.LoginPage })),
);
const ProfilePage = lazy(() =>
  import("./pages/Account").then((m) => ({ default: m.ProfilePage })),
);
const SearchPage = lazy(() => import("./pages/Search"));
import "./styles.css";
import "./polish.css";
import { BrandMark } from "./components/Brand";
createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<div className="state">正在打开学习空间…</div>}>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="discover" element={<Discover />} />
              <Route path="topics/:id" element={<TopicHub />} />
              <Route path="learn" element={<Learn />} />
              <Route path="learn/:id" element={<PathPage />} />
              <Route path="lessons/:id" element={<LessonPage />} />
              <Route path="copilot" element={<Copilot />} />
              <Route path="lab" element={<Labs />} />
              <Route path="lab/:id" element={<LabPage />} />
              <Route path="fintalk" element={<Community />} />
              <Route path="fintalk/:id" element={<PostPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="login" element={<LoginPage />} />
              <Route path="search" element={<SearchPage />} />
              <Route
                path="*"
                element={
                  <div className="state">
                    <BrandMark size={64} />
                    <span className="eyebrow">404 / FINPILOT</span>
                    <h1>好像走出了知识地图。</h1>
                    <p>这个页面不存在，换一个方向继续探索吧。</p>
                    <Link className="button" to="/">
                      回到首页
                    </Link>
                    <Link className="text-link" to="/discover">
                      去 Discover →
                    </Link>
                  </div>
                }
              />
            </Route>
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  </ErrorBoundary>,
);
