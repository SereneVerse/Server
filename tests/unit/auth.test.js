const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");
const request = require("supertest");

// stub env before importing app
process.env.JWT_ACCESS_SECRET = "test-access-secret";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
process.env.JWT_KEY = "test-access-secret";
process.env.SESSION_SECRET = "test-session-secret";
process.env.NODE_ENV = "test";
process.env.MONGO_URL = "will-be-replaced-by-memory-server";
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

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  process.env.LOCAL_MONGO_URL = uri;
  await mongoose.connect(uri);
  // import app after env is set
  app = require("../../config/app.config");
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

afterEach(async () => {
  // clear all collections between tests
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

describe("POST /auth/register", () => {
  const validUser = {
    fullName: "Test User",
    userName: "testuser",
    email: "test@example.com",
    phone: "08012345678",
    password: "Password123!",
    dateOfBirth: "1995-01-01",
    role: 1, // should be ignored — always set to 3
  };

  it("creates a user and returns 201", async () => {
    const res = await request(app).post("/auth/register").send(validUser);
    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe("success");
  });

  it("never returns password in response", async () => {
    const res = await request(app).post("/auth/register").send(validUser);
    expect(res.body.data?.password).toBeUndefined();
    expect(res.body.data?.hash).toBeUndefined();
  });

  it("ignores role from body and always assigns role 3", async () => {
    const res = await request(app).post("/auth/register").send({ ...validUser, role: 1 });
    expect(res.statusCode).toBe(201);
    expect(res.body.data?.role).toBe(3);
  });

  it("rejects duplicate email with 403", async () => {
    await request(app).post("/auth/register").send(validUser);
    const res = await request(app).post("/auth/register").send(validUser);
    expect(res.statusCode).toBe(403);
  });
});

describe("POST /auth/login", () => {
  beforeEach(async () => {
    await request(app).post("/auth/register").send({
      fullName: "Login User",
      userName: "loginuser",
      email: "login@example.com",
      phone: "08099999999",
      password: "Password123!",
      dateOfBirth: "1995-01-01",
    });
  });

  it("logs in with correct credentials and returns token", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "login@example.com", password: "Password123!" });
    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it("never returns password in login response", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "login@example.com", password: "Password123!" });
    expect(res.body.data?.password).toBeUndefined();
    expect(res.body.data?.hash).toBeUndefined();
  });

  it("rejects wrong password with 400", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "login@example.com", password: "WrongPassword!" });
    expect(res.statusCode).toBe(400);
  });

  it("rejects unknown email with 400", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "nobody@example.com", password: "Password123!" });
    expect(res.statusCode).toBe(400);
  });
});
