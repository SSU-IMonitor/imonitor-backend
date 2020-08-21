const authorize = require("../../middleware/authorize");
const db = require("../../../models");

module.exports = (router) => {
    router.get("/users/:userId/exams/:examId/submit", authorize, async function(req, res, next) {
        const userId = req.params.userId;
        const examId = req.params.examId;
        const tokenUserId = res.locals.userId;

        // if by userId or examId does not exist => 404
        const exam = await db.exams.findByPk(examId);
        const user = await db.users.findByPk(userId);

        console.log(examId)
        console.log(userId)
        if(user === null) res.status(404).json({ message: "user does not exist" });
        if(exam === null) res.status(404).json({ message: "exam does not exist "});
        // if userId does not match userId => 403
        if(userId !== tokenUserId) res.status(403).json({ message: "cannot get other users submit" });

        // return
        const qnas = await db.qnas.findAll({
            where: { examId: examId },
            include: [
                { model: db.answerChoices, as: "choices" },
                { model: db.submits, as: "submits", where: { applyeeId: userId }, include: [{ model: db.users, as: "applyee" }] },
            ]
        });

        res.status(200).json({
            result: qnas.map(qna => {
                return {
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
            })
        });
    });
}