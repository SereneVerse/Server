const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");
const request = require("supertest");

// env stubs
process.env.JWT_ACCESS_SECRET = "test-access-secret";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
process.env.JWT_KEY = "test-access-secret";
process.env.SESSION_SECRET = "test-session-secret";
process.env.NODE_ENV = "test";
process.env.ABLY_API_KEY = "test-ably-key";
process.env.ANTHROPIC_API_KEY = "test-anthropic-key";
process.env.CRON_SECRET = "test-cron-secret";
process.env.CLOUDINARY_CLOUD_NAME = "test";
process.env.CLOUDINARY_API_KEY = "test";
process.env.CLOUDINARY_API_SECRET = "test";
process.env.MAIL_HOST = "test";
process.env.USER = "test@test.com";
process.env.PASS = "testpass";
process.env.GOOGLE_CLIENT_ID = "test";
process.env.GOOGLE_CLIENT_SECRET = "test";
process.env.CLIENT_REDIRECT = "http://localhost:3000";

let mongod;
let app;
let token;
let streakId;

const registerAndLogin = async (app) => {
  await request(app).post("/auth/register").send({
    fullName: "Streak Tester",
    userName: "streaktester",
    email: "streak@example.com",
    phone: "08011111111",
    password: "Password123!",
    dateOfBirth: "1995-01-01",
  });
  const res = await request(app)
    .post("/auth/login")
    .send({ email: "streak@example.com", password: "Password123!" });
  return res.body.token;
};

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  process.env.LOCAL_MONGO_URL = uri;
  await mongoose.connect(uri);
  app = require("../../config/app.config");
  token = await registerAndLogin(app);

  const res = await request(app)
    .post("/streak/start")
    .set("Authorization", `Bearer ${token}`)
    .send({ name: "No Sugar" });
  streakId = res.body.data?.streak?._id;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

describe("GET /streak/yay/:id (read-only)", () => {
  it("returns streak without incrementing count", async () => {
    const res1 = await request(app)
      .get(`/streak/yay/${streakId}`)
      .set("Authorization", `Bearer ${token}`);
    const count1 = res1.body.data?.streak?.currentStreak;

    const res2 = await request(app)
      .get(`/streak/yay/${streakId}`)
      .set("Authorization", `Bearer ${token}`);
    const count2 = res2.body.data?.streak?.currentStreak;

    expect(res1.statusCode).toBe(200);
    expect(count1).toBe(count2);
  });
});

describe("POST /streak/checkin/:id", () => {
  it("increments streak count when called after 24h", async () => {
    // manually backdate lastUpdated to simulate 24h passing
    const { Streak } = require("../../models/streaks.model");
    await Streak.findByIdAndUpdate(streakId, {
      lastUpdated: new Date(Date.now() - 25 * 60 * 60 * 1000),
    });

    const before = await request(app)
      .get(`/streak/yay/${streakId}`)
      .set("Authorization", `Bearer ${token}`);
    const countBefore = before.body.data?.streak?.currentStreak;

    const checkIn = await request(app)
      .post(`/streak/checkin/${streakId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(checkIn.statusCode).toBe(200);

    const after = await request(app)
      .get(`/streak/yay/${streakId}`)
      .set("Authorization", `Bearer ${token}`);
    const countAfter = after.body.data?.streak?.currentStreak;

    expect(countAfter).toBe(countBefore + 1);
  });

  it("does not double-increment within 24h", async () => {
    const before = await request(app)
      .get(`/streak/yay/${streakId}`)
      .set("Authorization", `Bearer ${token}`);
    const countBefore = before.body.data?.streak?.currentStreak;

    // call check-in twice without backdating
    await request(app)
      .post(`/streak/checkin/${streakId}`)
      .set("Authorization", `Bearer ${token}`);
    await request(app)
      .post(`/streak/checkin/${streakId}`)
      .set("Authorization", `Bearer ${token}`);

    const after = await request(app)
      .get(`/streak/yay/${streakId}`)
      .set("Authorization", `Bearer ${token}`);
    const countAfter = after.body.data?.streak?.currentStreak;

    expect(countAfter).toBe(countBefore);
  });
});
