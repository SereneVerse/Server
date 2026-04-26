const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");
const request = require("supertest");

process.env.JWT_ACCESS_SECRET = "test-access-secret";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
process.env.JWT_KEY = "test-access-secret";
process.env.SESSION_SECRET = "test-session-secret";
process.env.NODE_ENV = "test";
process.env.ABLY_API_KEY = "test";
process.env.ANTHROPIC_API_KEY = "test";
process.env.CRON_SECRET = "test";
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
  app = require("../../config/app.config");
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

describe("Rate limiting on auth endpoints", () => {
  it("blocks login after 10 rapid requests with 429", async () => {
    const requests = Array.from({ length: 11 }, () =>
      request(app)
        .post("/auth/login")
        .send({ email: "x@x.com", password: "wrong" })
    );
    const responses = await Promise.all(requests);
    const statuses = responses.map((r) => r.statusCode);
    expect(statuses).toContain(429);
  });
});
