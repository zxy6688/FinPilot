import { lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { AuthProvider } from "./services/auth";
import { ErrorBoundary } from "./components/ui";
import Layout from "./redesign/Layout";
import { Notebook, StoryPreview, Methods } from "./redesign/Home";
import RedesignHome from "./redesign/Home";
import { Magazine, ToolDirectory } from "./redesign/Catalog";
import { BondsStory } from "./redesign/Bonds";
import { EtfStory } from "./redesign/Etf";
import { LoanWorkbench, LoanStory } from "./redesign/Loan";
import { TimeWorkbench } from "./redesign/TimeTools";
import { BudgetWorkbench } from "./redesign/Experiments";
import { BudgetStory } from "./redesign/Stories";
import MoneyLab from "./redesign/MoneyLab";
import Decoder from "./redesign/Decoder";
import ConceptStudio from "./redesign/ConceptStudio";
import { FinDesign } from "./redesign/Fin";
const LearningRoutePage = lazy(() => import("./living/RouteExperience"));
const Knowledge = lazy(() => import("./living/Knowledge"));
const ArticleReader = lazy(() => import("./living/ArticleReader"));
const Review = lazy(() => import("./living/Review"));
const Compare = lazy(() => import("./living/Compare"));
const Discover = lazy(() => import("./living/Discover"));
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
const LabPage = lazy(() => import("./living/LabExperience"));
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
const ProfilePage = lazy(() => import("./living/MyWorld"));
const SearchPage = lazy(() => import("./pages/Search"));
import "./styles.css";
import "./polish.css";
import "./v2.css";
import "./living/living.css";
import "./redesign/redesign.css";
import { BrandMark } from "./components/Brand";
createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<div className="state">正在打开学习空间…</div>}>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<RedesignHome />} />
              <Route path="decoder/purchasing-power" element={<Decoder />} />
              <Route path="stories/bonds" element={<BondsStory />} />
              <Route path="stories/etf" element={<EtfStory />} />
              <Route path="stories/loan" element={<LoanStory />} />
              <Route path="money-lab/loan" element={<LoanWorkbench />} />
              <Route path="stories/budget" element={<BudgetStory />} />
              <Route
                path="money-lab/compound"
                element={<TimeWorkbench key="compound" tool="compound" />}
              />
              <Route
                path="money-lab/inflation"
                element={<TimeWorkbench key="inflation" tool="inflation" />}
              />
              <Route path="money-lab/savings" element={<MoneyLab />} />
              <Route path="money-lab/budget" element={<BudgetWorkbench />} />
              <Route path="money-lab" element={<ToolDirectory />} />
              <Route path="concept-studio" element={<ConceptStudio />} />
              <Route path="stories/:slug" element={<StoryPreview />} />
              <Route path="fin-design" element={<FinDesign />} />
              <Route path="methods" element={<Methods />} />
              <Route path="discover/library" element={<Discover />} />
              <Route path="profile/history" element={<ProfilePage />} />
              <Route path="knowledge" element={<Knowledge />} />
              <Route path="articles/:id" element={<ArticleReader />} />
              <Route path="review" element={<Review />} />
              <Route path="compare" element={<Compare />} />
              <Route path="compare/:slug" element={<Compare />} />
              <Route path="discover" element={<Magazine />} />
              <Route path="topics/:id" element={<TopicHub />} />
              <Route path="learn" element={<Learn />} />
              <Route path="learn/routes/:id" element={<LearningRoutePage />} />
              <Route path="learn/:id" element={<PathPage />} />
              <Route path="lessons/:id" element={<LessonPage />} />
              <Route path="copilot" element={<Copilot />} />
              <Route path="lab" element={<Labs />} />
              <Route path="lab/:id" element={<LabPage />} />
              <Route path="fintalk" element={<Community />} />
              <Route path="fintalk/:id" element={<PostPage />} />
              <Route path="profile" element={<Notebook />} />
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

import "./redesign/a1.css";

import "./redesign/gate-b.css";
