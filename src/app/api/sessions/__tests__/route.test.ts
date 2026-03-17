/**
 * @jest-environment node
 */
import { GET, POST } from "../route";

// --- Mocks ---
jest.mock("@/auth", () => ({ auth: jest.fn() }));
const mockDb = { select: jest.fn(), insert: jest.fn() };
jest.mock("@/db", () => ({ getDb: () => mockDb }));
jest.mock("@/db/schema", () => ({ pomodoroSessions: {}, tasks: {} }));
jest.mock("drizzle-orm", () => ({
  eq: jest.fn(),
  and: jest.fn(),
  desc: jest.fn(),
}));
jest.mock("@/lib/streak", () => ({ computeStreak: jest.fn().mockReturnValue(3) }));

import { auth } from "@/auth";
const db = mockDb;
import { computeStreak } from "@/lib/streak";

const TODAY = new Date().toLocaleDateString("en-CA");
const MOCK_SESSION_USER = { user: { id: "user-1" } };

const MOCK_ROW = {
  id: "sess-1",
  durationSeconds: 1500,
  completionDate: TODAY,
  completedAt: new Date(),
  taskId: "task-1",
  taskColor: "#31C202",
  taskName: "Deep Work",
};

// Chainable select mock for sessions route (uses leftJoin + orderBy)
function mockSelect(result: unknown[]) {
  const chain = {
    from: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockResolvedValue(result),
  };
  (db.select as jest.Mock).mockReturnValue(chain);
  return chain;
}

function mockInsert(result: unknown[]) {
  const chain = {
    values: jest.fn().mockReturnThis(),
    returning: jest.fn().mockResolvedValue(result),
  };
  (db.insert as jest.Mock).mockReturnValue(chain);
  return chain;
}

beforeEach(() => jest.clearAllMocks());

describe("GET /api/sessions", () => {
  it("returns 401 when not authenticated", async () => {
    (auth as jest.Mock).mockResolvedValue(null);
    const req = new Request(`http://localhost/api/sessions?today=${TODAY}`);
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("returns todaySessions, streak, and total", async () => {
    (auth as jest.Mock).mockResolvedValue(MOCK_SESSION_USER);
    mockSelect([MOCK_ROW]);

    const req = new Request(`http://localhost/api/sessions?today=${TODAY}`);
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toHaveProperty("todaySessions");
    expect(data).toHaveProperty("streak");
    expect(data).toHaveProperty("total");
  });

  it("filters todaySessions by today's date", async () => {
    (auth as jest.Mock).mockResolvedValue(MOCK_SESSION_USER);
    const oldRow = { ...MOCK_ROW, id: "sess-old", completionDate: "2020-01-01" };
    mockSelect([MOCK_ROW, oldRow]);

    const req = new Request(`http://localhost/api/sessions?today=${TODAY}`);
    const res = await GET(req);
    const data = await res.json();

    expect(data.todaySessions).toHaveLength(1);
    expect(data.todaySessions[0].id).toBe("sess-1");
  });

  it("falls back to '#31C202' when task color is null", async () => {
    (auth as jest.Mock).mockResolvedValue(MOCK_SESSION_USER);
    mockSelect([{ ...MOCK_ROW, taskColor: null }]);

    const req = new Request(`http://localhost/api/sessions?today=${TODAY}`);
    const res = await GET(req);
    const data = await res.json();

    expect(data.todaySessions[0].color).toBe("#31C202");
  });

  it("returns the streak from computeStreak", async () => {
    (auth as jest.Mock).mockResolvedValue(MOCK_SESSION_USER);
    (computeStreak as jest.Mock).mockReturnValue(7);
    mockSelect([MOCK_ROW]);

    const req = new Request(`http://localhost/api/sessions?today=${TODAY}`);
    const res = await GET(req);
    const data = await res.json();

    expect(data.streak).toBe(7);
  });

  it("returns total count of all sessions", async () => {
    (auth as jest.Mock).mockResolvedValue(MOCK_SESSION_USER);
    mockSelect([MOCK_ROW, { ...MOCK_ROW, id: "sess-2", completionDate: "2020-01-01" }]);

    const req = new Request(`http://localhost/api/sessions?today=${TODAY}`);
    const res = await GET(req);
    const data = await res.json();

    expect(data.total).toBe(2);
  });
});

describe("POST /api/sessions", () => {
  it("returns 401 when not authenticated", async () => {
    (auth as jest.Mock).mockResolvedValue(null);
    const req = new Request("http://localhost/api/sessions", {
      method: "POST",
      body: JSON.stringify({ durationSeconds: 1500, completionDate: TODAY }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 when durationSeconds is 0", async () => {
    (auth as jest.Mock).mockResolvedValue(MOCK_SESSION_USER);
    const req = new Request("http://localhost/api/sessions", {
      method: "POST",
      body: JSON.stringify({ durationSeconds: 0, completionDate: TODAY }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when durationSeconds is less than 60", async () => {
    (auth as jest.Mock).mockResolvedValue(MOCK_SESSION_USER);
    const req = new Request("http://localhost/api/sessions", {
      method: "POST",
      body: JSON.stringify({ durationSeconds: 30, completionDate: TODAY }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("creates a session and returns 201 with stats", async () => {
    (auth as jest.Mock).mockResolvedValue(MOCK_SESSION_USER);
    mockInsert([{ id: "new-sess", durationSeconds: 1500, completionDate: TODAY }]);
    // Second select call (for stats recomputation)
    mockSelect([MOCK_ROW]);

    const req = new Request("http://localhost/api/sessions", {
      method: "POST",
      body: JSON.stringify({ durationSeconds: 1500, completionDate: TODAY, taskId: "task-1" }),
    });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data).toHaveProperty("session");
    expect(data).toHaveProperty("todaySessions");
    expect(data).toHaveProperty("streak");
  });

  it("accepts a null taskId (no task selected)", async () => {
    (auth as jest.Mock).mockResolvedValue(MOCK_SESSION_USER);
    const insertChain = mockInsert([{ id: "new-sess", durationSeconds: 1500, completionDate: TODAY }]);
    mockSelect([MOCK_ROW]);

    const req = new Request("http://localhost/api/sessions", {
      method: "POST",
      body: JSON.stringify({ durationSeconds: 1500, completionDate: TODAY, taskId: null }),
    });
    await POST(req);

    expect(insertChain.values).toHaveBeenCalledWith(
      expect.objectContaining({ taskId: null })
    );
  });

  it("uses server date as fallback when completionDate is missing", async () => {
    (auth as jest.Mock).mockResolvedValue(MOCK_SESSION_USER);
    const insertChain = mockInsert([{ id: "new-sess", durationSeconds: 1500, completionDate: TODAY }]);
    mockSelect([]);

    const req = new Request("http://localhost/api/sessions", {
      method: "POST",
      body: JSON.stringify({ durationSeconds: 1500 }),
    });
    await POST(req);

    expect(insertChain.values).toHaveBeenCalledWith(
      expect.objectContaining({ completionDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/) })
    );
  });
});
