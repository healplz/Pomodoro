/**
 * @jest-environment node
 */
import { GET, POST } from "../route";

// --- Mocks ---
jest.mock("@/auth", () => ({ auth: jest.fn() }));
const mockDb = { select: jest.fn(), insert: jest.fn() };
jest.mock("@/db", () => ({ getDb: () => mockDb }));
jest.mock("@/db/schema", () => ({ tasks: {} }));
jest.mock("drizzle-orm", () => ({ eq: jest.fn(), isNull: jest.fn() }));

import { auth } from "@/auth";
const db = mockDb;

// Helper to build a chainable Drizzle select mock
function mockSelect(result: unknown[]) {
  const chain = {
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockResolvedValue(result),
  };
  (db.select as jest.Mock).mockReturnValue(chain);
  return chain;
}

// Helper to build a chainable Drizzle insert mock
function mockInsert(result: unknown[]) {
  const chain = {
    values: jest.fn().mockReturnThis(),
    returning: jest.fn().mockResolvedValue(result),
  };
  (db.insert as jest.Mock).mockReturnValue(chain);
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

beforeEach(() => jest.clearAllMocks());

describe("GET /api/tasks", () => {
  it("returns 401 when not authenticated", async () => {
    (auth as jest.Mock).mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns only non-archived tasks", async () => {
    (auth as jest.Mock).mockResolvedValue(MOCK_SESSION);
    const archived = { ...MOCK_TASK, id: "task-2", archivedAt: new Date() };
    mockSelect([MOCK_TASK, archived]);

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toHaveLength(1);
    expect(data[0].id).toBe("task-1");
  });

  it("returns an empty array when the user has no tasks", async () => {
    (auth as jest.Mock).mockResolvedValue(MOCK_SESSION);
    mockSelect([]);

    const res = await GET();
    const data = await res.json();

    expect(data).toEqual([]);
  });
});

describe("POST /api/tasks", () => {
  it("returns 401 when not authenticated", async () => {
    (auth as jest.Mock).mockResolvedValue(null);
    const req = new Request("http://localhost/api/tasks", {
      method: "POST",
      body: JSON.stringify({ name: "Focus", color: "#31C202" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 when name is missing", async () => {
    (auth as jest.Mock).mockResolvedValue(MOCK_SESSION);
    const req = new Request("http://localhost/api/tasks", {
      method: "POST",
      body: JSON.stringify({ color: "#31C202" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when name is an empty string", async () => {
    (auth as jest.Mock).mockResolvedValue(MOCK_SESSION);
    const req = new Request("http://localhost/api/tasks", {
      method: "POST",
      body: JSON.stringify({ name: "   ", color: "#31C202" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("creates and returns the task with status 201", async () => {
    (auth as jest.Mock).mockResolvedValue(MOCK_SESSION);
    mockInsert([MOCK_TASK]);

    const req = new Request("http://localhost/api/tasks", {
      method: "POST",
      body: JSON.stringify({ name: "Deep Work", color: "#31C202" }),
    });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.name).toBe("Deep Work");
  });

  it("uses the default color when color is not provided", async () => {
    (auth as jest.Mock).mockResolvedValue(MOCK_SESSION);
    const chain = mockInsert([{ ...MOCK_TASK, color: "#E63946" }]);

    const req = new Request("http://localhost/api/tasks", {
      method: "POST",
      body: JSON.stringify({ name: "Focus" }),
    });
    await POST(req);

    expect(chain.values).toHaveBeenCalledWith(
      expect.objectContaining({ color: "#E63946" })
    );
  });

  it("trims whitespace from the task name", async () => {
    (auth as jest.Mock).mockResolvedValue(MOCK_SESSION);
    const chain = mockInsert([MOCK_TASK]);

    const req = new Request("http://localhost/api/tasks", {
      method: "POST",
      body: JSON.stringify({ name: "  Focus  ", color: "#31C202" }),
    });
    await POST(req);

    expect(chain.values).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Focus" })
    );
  });
});
