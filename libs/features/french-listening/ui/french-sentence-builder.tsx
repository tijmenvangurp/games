import type { FrenchLesson } from "@entities/french";
import { useSentenceBuilder } from "../model/use-sentence-builder";
import {
  SentenceAnswer,
  SentenceBuilderFinished,
  SentenceBuilderHeader,
  SentenceControls,
  SentenceFeedback,
  SentencePrompt,
  SentenceWordBank,
} from "./french-sentence-builder-parts";

interface FrenchSentenceBuilderProps {
  lesson: FrenchLesson;
}

export function FrenchSentenceBuilder({ lesson }: FrenchSentenceBuilderProps) {
  const state = useSentenceBuilder(lesson);

  if (state.finished || !state.item) {
    return (
      <SentenceBuilderFinished
        score={state.score}
        total={state.phrases.length}
        onRestart={state.restart}
      />
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-3">
      <SentenceBuilderHeader index={state.index} score={state.score} total={state.phrases.length} />
      <SentencePrompt item={state.item} />
      <SentenceAnswer answered={state.answered} selected={state.selected} onRemove={state.remove} />
      <SentenceWordBank
        answered={state.answered}
        available={state.available}
        onChoose={state.choose}
      />
      {state.answered ? (
        <SentenceFeedback correct={state.correct} item={state.item} onNext={state.next} />
      ) : (
        <SentenceControls
          disabled={state.selected.length === 0}
          onCheck={state.check}
          onReset={state.resetPuzzle}
        />
      )}
    </div>
  );
}
