/**
 * @jest-environment node
 */
import { PATCH, DELETE } from "../route";

// --- Mocks ---
jest.mock("@/auth", () => ({ auth: jest.fn() }));
jest.mock("@/db", () => ({ db: { update: jest.fn() } }));
jest.mock("@/db/schema", () => ({ tasks: {} }));
jest.mock("drizzle-orm", () => ({ eq: jest.fn(), and: jest.fn() }));

import { auth } from "@/auth";
import { db } from "@/db";

function mockUpdate(result: unknown[]) {
  const chain = {
    set: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    returning: jest.fn().mockResolvedValue(result),
  };
  (db.update as jest.Mock).mockReturnValue(chain);
  return chain;
}

const MOCK_SESSION = { user: { id: "user-1" } };
const MOCK_TASK = {
  id: "task-1",
  userId: "user-1",
  name: "Deep Work",
  color: "#31C202",
  createdAt: new Date(),
  archivedAt: null,
};
const PARAMS = Promise.resolve({ id: "task-1" });

beforeEach(() => jest.clearAllMocks());

describe("PATCH /api/tasks/[id]", () => {
  it("returns 401 when not authenticated", async () => {
    (auth as jest.Mock).mockResolvedValue(null);
    const req = new Request("http://localhost/api/tasks/task-1", {
      method: "PATCH",
      body: JSON.stringify({ name: "New Name" }),
    });
    const res = await PATCH(req, { params: PARAMS });
    expect(res.status).toBe(401);
  });

  it("returns 400 when no valid fields are provided", async () => {
    (auth as jest.Mock).mockResolvedValue(MOCK_SESSION);
    const req = new Request("http://localhost/api/tasks/task-1", {
      method: "PATCH",
      body: JSON.stringify({ unknown: "field" }),
    });
    const res = await PATCH(req, { params: PARAMS });
    expect(res.status).toBe(400);
  });

  it("updates the task name and returns 200", async () => {
    (auth as jest.Mock).mockResolvedValue(MOCK_SESSION);
    const updated = { ...MOCK_TASK, name: "New Name" };
    mockUpdate([updated]);

    const req = new Request("http://localhost/api/tasks/task-1", {
      method: "PATCH",
      body: JSON.stringify({ name: "New Name" }),
    });
    const res = await PATCH(req, { params: PARAMS });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.name).toBe("New Name");
  });

  it("updates the task color", async () => {
    (auth as jest.Mock).mockResolvedValue(MOCK_SESSION);
    const chain = mockUpdate([{ ...MOCK_TASK, color: "#02C25E" }]);

    const req = new Request("http://localhost/api/tasks/task-1", {
      method: "PATCH",
      body: JSON.stringify({ color: "#02C25E" }),
    });
    await PATCH(req, { params: PARAMS });

    expect(chain.set).toHaveBeenCalledWith(
      expect.objectContaining({ color: "#02C25E" })
    );
  });

  it("returns 404 when task is not found", async () => {
    (auth as jest.Mock).mockResolvedValue(MOCK_SESSION);
    mockUpdate([]);

    const req = new Request("http://localhost/api/tasks/no-such-task", {
      method: "PATCH",
      body: JSON.stringify({ name: "Whatever" }),
    });
    const res = await PATCH(req, { params: PARAMS });
    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/tasks/[id]", () => {
  it("returns 401 when not authenticated", async () => {
    (auth as jest.Mock).mockResolvedValue(null);
    const req = new Request("http://localhost/api/tasks/task-1", { method: "DELETE" });
    const res = await DELETE(req, { params: PARAMS });
    expect(res.status).toBe(401);
  });

  it("soft-deletes the task and returns 204", async () => {
    (auth as jest.Mock).mockResolvedValue(MOCK_SESSION);
    const chain = mockUpdate([MOCK_TASK]);

    const req = new Request("http://localhost/api/tasks/task-1", { method: "DELETE" });
    const res = await DELETE(req, { params: PARAMS });

    expect(res.status).toBe(204);
    expect(chain.set).toHaveBeenCalledWith(
      expect.objectContaining({ archivedAt: expect.any(Date) })
    );
  });

  it("returns 404 when task is not found", async () => {
    (auth as jest.Mock).mockResolvedValue(MOCK_SESSION);
    mockUpdate([]);

    const req = new Request("http://localhost/api/tasks/no-such", { method: "DELETE" });
    const res = await DELETE(req, { params: PARAMS });
    expect(res.status).toBe(404);
  });
});
