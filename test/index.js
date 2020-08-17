const chai = require("chai");
const expect = require("chai").expect;
const chaiHttp = require("chai-http");
const chaiResponseValidator = require("chai-openapi-response-validator");
const app = require("../src/app");
const db = require("../src/models");
const path = require("path");

chai.use(chaiHttp);
chai.use(chaiResponseValidator(path.join(__dirname, "../spec/imonitor-api.v1.yaml")));
chai.should();

before(async function() {
    await db.sequelize.sync({ force: true });
});

async function signUp(request) {
    return chai.request(app)
        .post("/v1/auth/sign-up")
        .send(request);
}

describe("sign up", function() {
    it("should success", async function() {
        const signUpRequest = {
            id: "20202020",
            name: "홍길동",
            password: "password",
            major: "소프트웨어학과"
        };

        const res = await signUp(signUpRequest);

        expect(res.status).to.equal(201);
        expect(res).to.satisfyApiSpec;
    });
})