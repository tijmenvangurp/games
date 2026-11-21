import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  AnswerOption,
  Badge,
  Button,
  ChoiceCard,
  Dialog,
  Disclosure,
  OptionPicker,
  Panel,
  ProgressBar,
  ScoreHeader,
  SetupPanel,
  StatusBanner,
  TextInput,
  vars,
} from "@shared/ui";

afterEach(() => {
  cleanup();
});

describe("design system primitives", () => {
  it("exposes type-safe CSS variable references from tokens", () => {
    expect(vars.color.background).toBe("var(--background)");
    expect(vars.color.primary).toBe("var(--primary)");
    expect(vars.radius.lg).toBe("var(--ds-radius-lg)");
    expect(vars.shadow.panel).toBe("var(--ds-shadow-panel)");
  });

  it("renders Button variants and sizes and supports asChild", () => {
    const onClick = vi.fn();
    render(
      <div>
        <Button size="lg" variant="success" onClick={onClick}>
          Starten
        </Button>
        <Button size="sm" variant="soft">
          Zacht
        </Button>
        <Button variant="danger">Verwijder</Button>
        <Button asChild variant="outline">
          <a href="#test">Linkknop</a>
        </Button>
      </div>,
    );

    const start = screen.getByRole("button", { name: "Starten" });
    fireEvent.click(start);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("link", { name: "Linkknop" }).getAttribute("href")).toBe("#test");
  });

  it("renders Panel variants polymorphically", () => {
    render(
      <Panel as="section" aria-label="Testpaneel" interactive padding="lg" surface="subtle">
        Inhoud
      </Panel>,
    );

    const panel = screen.getByRole("region", { name: "Testpaneel" });
    expect(panel.tagName).toBe("SECTION");
    expect(panel.textContent).toBe("Inhoud");
  });

  it("renders ChoiceCard and OptionPicker with compact size and leading node", () => {
    const onSelect = vi.fn();
    render(
      <OptionPicker
        columns="2-3"
        legend="Kies optie"
        options={[
          { value: "a", label: "Optie A", leading: <span>*</span>, description: "Eerste" },
          { value: "b", label: "Optie B", symbol: "B" },
        ]}
        selected="a"
        size="compact"
        onSelect={onSelect}
      />,
    );

    const first = screen.getByRole("button", { name: /Optie A/ });
    const second = screen.getByRole("button", { name: /Optie B/ });
    expect(first.getAttribute("aria-pressed")).toBe("true");
    expect(second.getAttribute("aria-pressed")).toBe("false");

    fireEvent.click(second);
    expect(onSelect).toHaveBeenCalledWith("b");
  });

  it("renders ChoiceCard directly with ariaLabel", () => {
    const onClick = vi.fn();
    render(
      <ChoiceCard ariaLabel="Gekozen kaart" label="Kaart" selected={false} onClick={onClick} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Gekozen kaart" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("renders AnswerOption states and indicators", () => {
    const onClick = vi.fn();
    render(
      <div>
        <AnswerOption badge="A" state="default" onClick={onClick}>
          Open
        </AnswerOption>
        <AnswerOption badge="B" state="correct">
          Goed
        </AnswerOption>
        <AnswerOption state="wrong">Fout</AnswerOption>
        <AnswerOption badge="C" state="warn" wrongIcon="retry">
          Bijna
        </AnswerOption>
        <AnswerOption state="muted">Uit</AnswerOption>
      </div>,
    );

    const open = screen.getByRole("button", { name: "Open" });
    fireEvent.click(open);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Goed" }).getAttribute("data-answer-state")).toBe(
      "correct",
    );
    expect((screen.getByRole("button", { name: "Fout" }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole("button", { name: "Uit" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("renders StatusBanner with tones, icon and action", () => {
    render(
      <StatusBanner
        action={<button type="button">Actie</button>}
        align="center"
        icon={<span>!</span>}
        tone="warning"
      >
        Let op
      </StatusBanner>,
    );

    expect(screen.getByText("Let op")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Actie" })).toBeTruthy();
  });

  it("renders Dialog and closes on Escape and backdrop click when enabled", () => {
    const onClose = vi.fn();
    render(
      <Dialog dismissOnBackdrop labelledBy="dlg-title" size="md" tone="parchment" onClose={onClose}>
        <h2 id="dlg-title">Dialoog</h2>
        <button type="button">Binnen</button>
      </Dialog>,
    );

    const dialog = screen.getByRole("dialog", { name: "Dialoog" });
    fireEvent.click(screen.getByRole("button", { name: "Binnen" }));
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.keyDown(dialog, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(dialog);
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("renders ProgressBar with clamped ratio and ARIA values", () => {
    render(<ProgressBar label="Voortgang" max={10} size="md" tone="success" value={4} />);
    const bar = screen.getByRole("progressbar", { name: "Voortgang" });
    expect(bar.getAttribute("aria-valuenow")).toBe("4");
    expect(bar.getAttribute("aria-valuemax")).toBe("10");

    cleanup();
    render(<ProgressBar label="Leeg" max={0} value={0} />);
    expect(screen.getByRole("progressbar", { name: "Leeg" }).getAttribute("aria-valuemax")).toBe(
      "0",
    );
  });

  it("renders Badge, ScoreHeader and Disclosure", () => {
    render(
      <div>
        <ScoreHeader progress="Vraag 2 van 10" stars={5} streak={3} />
        <Badge size="sm" tone="primary">
          Nieuw
        </Badge>
        <Disclosure icon={<span>?</span>} summary="Meer uitleg">
          <p>Uitlegtekst</p>
        </Disclosure>
      </div>,
    );

    expect(screen.getByText("Vraag 2 van 10")).toBeTruthy();
    expect(screen.getByLabelText("5 sterren")).toBeTruthy();
    expect(screen.getByLabelText("3 op een rij")).toBeTruthy();
    expect(screen.getByText("Nieuw")).toBeTruthy();
    expect(screen.getByText("Meer uitleg")).toBeTruthy();
    expect(screen.getByText("Uitlegtekst")).toBeTruthy();
  });

  it("renders SetupPanel and TextInput", () => {
    const onStart = vi.fn();
    render(
      <SetupPanel
        headerAddon={<span>123</span>}
        note="Beste score: 8"
        subtitle="Korte uitleg"
        title="Nieuw spel"
        onStart={onStart}
      >
        <TextInput aria-label="Spelernaam" placeholder="Naam" />
      </SetupPanel>,
    );

    expect(screen.getByRole("heading", { name: "Nieuw spel" })).toBeTruthy();
    expect(screen.getByText("Korte uitleg")).toBeTruthy();
    expect(screen.getByText("Beste score: 8")).toBeTruthy();
    expect(screen.getByLabelText("Spelernaam")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Spelen" }));
    expect(onStart).toHaveBeenCalledTimes(1);
  });
});
