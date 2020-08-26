const authorize = require("../../middleware/authorize");
const Joi = require("joi");
const db = require("../../../models");

const postSubmitRequestValidator = Joi.object({
    submits: Joi.array().items(Joi.object({
        qnaId: Joi.number().integer().required(),
        answer: Joi.string().required()
    }))
});

module.exports = (router) => {
    router.get("/users/:userId/exams/:examId/submit", authorize, async function(req, res, next) {
        try {
            const userId = req.params.userId;
            const examId = req.params.examId;
            const tokenUserId = res.locals.userId;

            // if by userId or examId does not exist => 404
            const exam = await db.exams.findByPk(examId);
            const user = await db.users.findByPk(userId);

            if (user === null) res.status(404).json({message: "user does not exist"});
            if (exam === null) res.status(404).json({message: "exam does not exist "});
            // if userId does not match userId => 403
            if (userId !== tokenUserId) res.status(403).json({message: "cannot get other users submit"});

            const examAccessControl = await db.examAccessControls.findOrCreate({
                where: {
                    examId,
                    applyeeId: userId
                }
            });

            if (!examAccessControl.accessControl === "ACCEPTED") res.status(403).json({message: "User is not Accepted"});

            // return
            const qnas = await db.qnas.findAll({
                where: {examId: examId},
                include: [
                    {model: db.answerChoices, as: "choices"},
                    {
                        model: db.submits,
                        as: "submits",
                        where: {applyeeId: userId},
                        include: [{model: db.users, as: "applyee"}]
                    },
                ]
            });

            res.status(200).json({
                result: qnas.map(qna => {
                    return {
                        result: {
                            qna: {
                                id: qna.id,
                                question: qna.question,
                                answer: qna.answer,
                                type: qna.type,
                                choices: qna.choices
                            },
                            submittedAnswer: qna.submits.submittedAnswer,
                            isCorrect: qna.answer === qna.submits.submittedAnswer
                        }
                    }
                })
            });
        } catch (err) {
            next(err);
        }
    });

    router.post("/exams/:examId/submit", authorize, async function(req, res, next) {
        try {
            const examId = req.params.examId;
            const tokenUserId = req.params.userId;

            const exam = await db.exams.findByPk(examId);
            if (exam === null) res.status(404).json({message: "exam does not exist "});

            const examAccessControl = await db.examAccessControls.findOrCreate({
                where: {
                    examId,
                    applyeeId: tokenUserId
                }
            });

            if (!examAccessControl.accessControl === "ACCEPTED") res.status(403).json({ message: "User is not Accepted"});

            const { value, error} = postSubmitRequestValidator.validate(req.body);
            if(error) throw error;

            await Promise.all(value.submits.map(async submit => await db.submits.create({
                    ...submit
            })));

            const qnas = await db.qnas.findAll({
                where: { examId: examId },
                include: [
                    {model: db.answerChoices, as: "choices"},
                    {
                        model: db.submits,
                        as: "submits",
                        where: {applyeeId: userId},
                        include: [{model: db.users, as: "applyee"}]
                    },
                ]
            });

            res.status(200).json({
                result: qnas.map(qna => {
                    return {
                        result: {
                            qna: {
                                id: qna.id,
                                question: qna.question,
                                answer: qna.answer,
                                type: qna.type,
                                choices: qna.choices
                            },
                            submittedAnswer: qna.submits.submittedAnswer,
                            isCorrect: qna.answer === qna.submits.submittedAnswer
                        }
                    }
                })
            });
        } catch (err) {
            next(err);
        }
    });
}