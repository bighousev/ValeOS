import { describe, expect, it } from "vitest";
import {
  addDemoDependency,
  addDemoLead,
  changeDemoDeliverable,
  concludeDemoProject,
  moveDemoOpportunity,
  seedDemoState,
  sendDemoExternal,
  setDemoTaskStatus,
} from "./demo";

describe("demo local", () => {
  it("cria uma única oportunidade ao cadastrar um lead e sinaliza contato semelhante", () => {
    const initial = seedDemoState();
    const lead = {
      ...initial.leads[0],
      id: "lead-new",
      email: "MARINA@AURORA.EXEMPLO",
      interactions: [],
    };
    const next = addDemoLead(initial, lead, "opp-new");
    expect(next.leads).toHaveLength(initial.leads.length + 1);
    expect(next.leads[0].duplicateOf).toBe("lead-1");
    expect(
      next.opportunities.filter((item) => item.leadId === lead.id),
    ).toHaveLength(1);
  });

  it("exige valor e cliente para marcar uma oportunidade como ganha", () => {
    const initial = seedDemoState();
    expect(() =>
      moveDemoOpportunity(
        initial,
        "opp-1",
        "Ganho",
        null,
        undefined,
        "",
        "2026-10-14T12:00:00Z",
      ),
    ).toThrow();
    const next = moveDemoOpportunity(
      initial,
      "opp-1",
      "Ganho",
      18500,
      undefined,
      "Aurora Digital",
      "2026-10-14T12:00:00Z",
    );
    expect(next.opportunities.find((item) => item.id === "opp-1")?.stage).toBe(
      "Ganho",
    );
    expect(next.clients.some((item) => item.name === "Aurora Digital")).toBe(
      true,
    );
  });

  it("bloqueia dependência circular e tarefa com predecessora pendente", () => {
    const project = seedDemoState().projects[0];
    expect(() => addDemoDependency(project, "task-3", "task-1")).toThrow(
      "circular",
    );
    expect(() => setDemoTaskStatus(project, "task-3", "Concluída")).toThrow(
      "predecessoras",
    );
    const afterSecond = setDemoTaskStatus(project, "task-2", "Concluída");
    expect(
      setDemoTaskStatus(afterSecond, "task-3", "Concluída").tasks.find(
        (item) => item.id === "task-3",
      )?.status,
    ).toBe("Concluída");
  });

  it("exige dupla aprovação e nova versão após ajuste", () => {
    const project = seedDemoState().projects[0];
    expect(() => sendDemoExternal(project, "deliverable-1")).toThrow("interna");
    const requested = changeDemoDeliverable(
      project,
      "deliverable-1",
      "request",
      "Vitor",
    );
    expect(() =>
      changeDemoDeliverable(
        requested,
        "deliverable-1",
        "internalApprove",
        "Vitor",
      ),
    ).toThrow("Outra pessoa");
    const internal = changeDemoDeliverable(
      requested,
      "deliverable-1",
      "internalApprove",
      "Ana",
    );
    const external = sendDemoExternal(internal, "deliverable-1");
    const adjusted = changeDemoDeliverable(
      external,
      "deliverable-1",
      "externalAdjust",
      "Bianca",
      "Alterar cores",
    );
    expect(() =>
      changeDemoDeliverable(adjusted, "deliverable-1", "request", "Vitor"),
    ).toThrow("nova versão");
    const revised = changeDemoDeliverable(adjusted, "deliverable-1", "revise");
    expect(revised.deliverables[0]).toMatchObject({
      version: 2,
      status: "Rascunho",
    });
    expect(() => sendDemoExternal(revised, "deliverable-1")).toThrow("interna");
  });

  it("só conclui projeto com tarefas e entregáveis aprovados", () => {
    const project = seedDemoState().projects[0];
    expect(() => concludeDemoProject(project)).toThrow("tarefas");
    const withTasksDone = setDemoTaskStatus(
      setDemoTaskStatus(project, "task-2", "Concluída"),
      "task-3",
      "Concluída",
    );
    expect(() => concludeDemoProject(withTasksDone)).toThrow("entregáveis");
    const requested = changeDemoDeliverable(
      withTasksDone,
      "deliverable-1",
      "request",
      "Vitor",
    );
    const internal = changeDemoDeliverable(
      requested,
      "deliverable-1",
      "internalApprove",
      "Ana",
    );
    const external = sendDemoExternal(internal, "deliverable-1");
    const approved = changeDemoDeliverable(
      external,
      "deliverable-1",
      "externalApprove",
      "Bianca",
    );
    expect(concludeDemoProject(approved).status).toBe("Concluído");
  });
});
