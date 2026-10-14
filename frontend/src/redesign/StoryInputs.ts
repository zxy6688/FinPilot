import { useEffect, useRef, type Dispatch, type SetStateAction } from "react";
import { useSearchParams } from "react-router-dom";
import { useNotebook } from "./state";
import { readDraft } from "./drafts";

// Restore from the owner-scoped snapshot instead of putting a large budget in the URL.
export function useStoryInputs<T extends object>(
  setInputs: Dispatch<SetStateAction<T>>,
) {
  const [params] = useSearchParams();
  const notebook = useNotebook();
  const restored = useRef("");
  useEffect(() => {
    const id = params.get("reading");
    if (!id || id === restored.current) return;
    const record = notebook.entries.find((entry) => entry.id === id);
    const experiment = (record?.payload as { experiment?: unknown })
      ?.experiment;
    if (experiment && typeof experiment === "object") {
      setInputs((current) => readDraft(JSON.stringify(experiment), current));
      restored.current = id;
    }
  }, [params, notebook.entries, setInputs]);
}
