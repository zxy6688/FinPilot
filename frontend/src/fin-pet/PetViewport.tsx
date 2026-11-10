import { Component, lazy, Suspense, useState,useEffect, type ReactNode } from "react";
import { FinArt } from "../redesign/Fin";
const Scene = lazy(() => import("./FinScene"));
class CanvasBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
export default function PetViewport(
  props: React.ComponentProps<typeof Scene> & { lowPower?: boolean },
) {
  const [failed, setFailed] = useState(false),
    [ready, setReady] = useState(false);
  useEffect(()=>{if(!props.lowPower){setFailed(false);setReady(false)}},[props.lowPower]);
  const fallback = (
    <div className="pet-fallback">
      <FinArt size={80} action="calm" />
      <span>静态省电模式</span>
    </div>
  );
  if (props.lowPower || failed) return fallback;
  return (
    <CanvasBoundary fallback={fallback}>
      <div className="pet-render" data-ready={ready}>
        <Suspense
          fallback={<span className="pet-loading">正在载入 3D Fin…</span>}
        >
          <Scene
            {...props}
            onReady={() => {
              setReady(true);
              props.onReady?.();
            }}
            onFailure={() => setFailed(true)}
          />
        </Suspense>
        {!ready && <span className="pet-loading">正在载入 3D Fin…</span>}
      </div>
    </CanvasBoundary>
  );
}
