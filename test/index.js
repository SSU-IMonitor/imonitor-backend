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

async function signUp(request) {
    return chai.request(app)
        .post("/v1/auth/sign-up")
        .send(request);
}

async function signIn(request) {
    return chai.request(app)
        .post("/v1/auth/sign-in")
        .send(request);
}

async function postExam(signInResponse, request) {
    return chai.request(app)
        .post("/v1/exams")
        .set("Authorization", `${signInResponse.body.tokenType} ${signInResponse.body.accessToken}`)
        .send(request);
}

async function getExams(signInResponse, query) {
    return chai.request(app)
        .get("/v1/exams")
        .set("Authorization", `${signInResponse.body.tokenType} ${signInResponse.body.accessToken}`)
        .query(query);
}

describe("sign up", function() {
    before(async function() {
        await db.sequelize.sync({ force: true });
    });

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
});

describe("sign in", function() {
    before(async function() {
        await db.sequelize.sync({ force: true });
    });

    it("should success", async function() {
        const signUpRequest = {
            id: "20202020",
            name: "홍길동",
            password: "password",
            major: "소프트웨어학과"
        };

        await signUp(signUpRequest);

        const res = await signIn({
            id: signUpRequest.id,
            password: signUpRequest.password
        });

        expect(res.status).to.equal(200);
        expect(res).to.satisfyApiSpec;
    });
})

describe("post exam", function() {
    before(async function() {
        await db.sequelize.sync({ force: true });
    });

    it("should success", async function() {
        const signUpRequest = {
            id: "20202020",
            name: "홍길동",
            password: "password",
            major: "소프트웨어학과"
        };

        await signUp(signUpRequest);

        const signInResponse = await signIn({
            id: signUpRequest.id,
            password: signUpRequest.password
        });

        const postExamRequest = {
            "title": "시험",
            "notice": "공지",
            "courseName": "과목",
            "courseCode": "123123",
            "startTime": "2020-08-16T08:00:00",
            "endTime": "2020-08-16T10:00:00",
            "qnas": [
                {
                    "question": "문제1",
                    "answer": "2",
                    "type": "CHOICE",
                    "choices": [
                        {
                            "content": "답1",
                            "order": 1
                        },
                        {
                            "content": "답2",
                            "order": 2
                        },
                        {
                            "content": "답3",
                            "order": 3
                        },
                        {
                            "content": "답4",
                            "order": 4
                        },
                        {
                            "content": "답5",
                            "order": 5
                        }
                    ]
                },
                {
                    "question": "문제2",
                    "answer": "정답2",
                    "type": "SHORT_ANSWER"
                }
            ]
        };

        const res = await postExam(signInResponse, postExamRequest);

        expect(res.status).to.equal(201);
        expect(res).to.satisfyApiSpec;
    });
});

describe("get exams", function() {
    before(async function() {
        await db.sequelize.sync({ force: true });
    });

    it("should success", async function() {
        const signUpRequest = {
            id: "20202020",
            name: "홍길동",
            password: "password",
            major: "소프트웨어학과"
        };

        await signUp(signUpRequest);

        const signInResponse = await signIn({
            id: signUpRequest.id,
            password: signUpRequest.password
        });

        const postExamRequest = {
            "title": "시험",
            "notice": "공지",
            "courseName": "과목",
            "courseCode": "123123",
            "startTime": "2020-08-16T08:00:00",
            "endTime": "2020-08-16T10:00:00",
            "qnas": [
                {
                    "question": "문제1",
                    "answer": "2",
                    "type": "CHOICE",
                    "choices": [
                        {
                            "content": "답1",
                            "order": 1
                        },
                        {
                            "content": "답2",
                            "order": 2
                        },
                        {
                            "content": "답3",
                            "order": 3
                        },
                        {
                            "content": "답4",
                            "order": 4
                        },
                        {
                            "content": "답5",
                            "order": 5
                        }
                    ]
                },
                {
                    "question": "문제2",
                    "answer": "정답2",
                    "type": "SHORT_ANSWER"
                }
            ]
        };

        await postExam(signInResponse, postExamRequest);

        const res = await getExams(signInResponse, {});

        expect(res.status).to.equal(200);
        expect(res).to.satisfyApiSpec;
    });
});