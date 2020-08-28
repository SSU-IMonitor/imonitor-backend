const authorize = require("../../middleware/authorize");
const Joi = require("joi");
const db = require("../../../models");
const { Op } = require("sequelize");

const examQueryValidator = Joi.object({
    search: Joi.string().max(50),
    time: Joi.string(),
    direction: Joi.string().valid("DESC", "ASC"),
    limit: Joi.number().integer(),
    offset: Joi.number().integer(),
});

const postExamRequestValidator = Joi.object({
    title: Joi.string().max(50).required(),
    notice: Joi.string().max(50).required(),
    courseName: Joi.string().max(50).required(),
    courseCode: Joi.string().max(50).required(),
    startTime: Joi.string().isoDate().required(),
    endTime: Joi.string().isoDate().required(),
    qnas: Joi.array().items(Joi.object({
        question: Joi.string().max(150).required(),
        answer: Joi.string().max(50).required(),
        type: Joi.string().valid("CHOICE", "SHORT_ANSWER").required(),
        choices: Joi.array().items(Joi.object({
            content: Joi.string().max(50).required(),
            order: Joi.number().integer().required()
        }))
    })).required()
});

const putExamAccessControlRequestValidator = Joi.object({
    studentId: Joi.number().integer(),
    accessControl: Joi.string().valid("ACCEPTED", "UNACCEPTED", "BANNED")
});

const postMyExamRequestValidator = Joi.object({
    examId: Joi.number().integer()
});

module.exports = (router) => {
    router.get("/exams/:examId", authorize, async function(req, res, next) {
        try {
            const examId = req.params.examId;
            const userId = res.locals.userId;

            const exam = await db.exams.findOne({
                where: { id: examId },
                include: [
                    { model: db.users, as: "owner" },
                    {
                        model: db.qnas,
                        include: [{ model: db.answerChoices, as: "choices" }]
                    }
                ]
            });

            if(exam === null) res.status(404).json({ messge: "exam not found" });

            const examAccessControl = await db.examAccessControls.findOrCreate({
                where: {
                    examId,
                    applyeeId: userId
                }
            });

            if(exam.owner.id !== userId && !examAccessControl.accessControl === "ACCEPTED") res.status(403).json({ message: "User is not Accepted" });

            res.status(200).json({
                id: exam.id,
                owner: {
                    id: exam.owner.id,
                    name: exam.owner.name,
                    major: exam.owner.major
                },
                title: exam.title,
                notice: exam.notice,
                courseName: exam.courseName,
                courseCode: exam.courseCode,
                startTime: exam.startTime,
                endTime: exam.endTime,
                questions: exam.qnas.map(qna => {
                    return {
                        id: qna.id,
                        question: qna.question,
                        type: qna.type,
                        choices: qna.choices.map(choice => {
                            return {
                                id: choice.id,
                                order: choice.order,
                                content: choice.content
                            }
                        })
                    }
                })
            });
        } catch (err) {
            next(err);
        }
    });

    router.get("/exams", authorize, async function(req, res, next) {
        try {
            const { value, error } = examQueryValidator.validate(req.query);
            if(error) throw error;

            const { limit, offset, search, time, direction } = value;

            let searchOption = {};
            if(search !== undefined) searchOption = {
                [Op.or]: [
                    {
                        title: {
                            [Op.like]: `%${search}%`
                        }
                    },
                    {
                        courseName: {
                            [Op.like]: `%${search}%`
                        },
                    }   ,
                    {
                        courseCode: {
                            [Op.like]: `%${search}%`
                        }
                    },
                    {
                        "$owner.name$": {
                            [Op.like]: `%${search}%`
                        }
                    }
                ]
            }

            const exams = await db.exams.findAll({
                where: {
                    ...searchOption,
                    startTime: {
                        [Op.gte]: time || "1900-01-01T00:00:00"
                    }
                },
                limit,
                offset,
        		order: [["startTime", direction || "ASC"]],
                include: [ { model: db.users, as: "owner" } ]
            });

            res.status(200).json({
                exams: exams.map(exam => {
                    delete exam.dataValues.ownerId;
                    delete exam.dataValues.owner.dataValues.password;
                    delete exam.dataValues.owner.dataValues.role;
                    return exam;
                })
            });
        } catch (err) {
            next(err);
        }
    });

    router.post("/exams", authorize, async function(req, res, next) {
        try {
            const {value, error} = postExamRequestValidator.validate(req.body);
            if (error) throw error;

            const userId = res.locals.userId;
            const user = await db.users.findByPk(userId);
            if(user === null) res.status(404).json({ message: "User Not Found" });

            const examId = await db.sequelize.transaction(async function(t) {
                const _exam = await db.exams.create({
                    ...value,
                    ownerId: userId
                }, { transaction: t });

                await Promise.all(value.qnas.map(async qna => {
                    const _qna = await db.qnas.create({
                        ...qna,
                        examId: _exam.id
                    }, { transaction: t })

                    if(qna.choices) {
                        await Promise.all(qna.choices.map(async choice => await db.answerChoices.create({
                            ...choice,
                            qnaId: _qna.id
                        }, { transaction: t })));
                    }
                }));

                return _exam.id;
            });

            const exam = await db.exams.findOne({
                where: { id: examId },
                include: [ { model: db.users, as: "owner" } ]
            });

            const { owner, ...rest } = exam.dataValues;

            res.status(201).json({
                ...rest,
                owner: {
                    id: owner.id,
                    name: owner.name,
                    major: owner.major
                }
            });
        } catch(err) {
            next(err);
        }
    });

    router.put("/exams/:examId/access-control", authorize, async function(req, res, next) {
        try {
            const examId = req.params.examId;
            const userId = res.locals.userId;

            const exam = await db.exams.findOne({
                where: {
                    id: examId
                },
                include: [ { model: db.users, as: "owner" } ]
            });

            if(exam === null) res.status(404).json({ message: "exam not found" });
            if(exam.owner.id !== userId) res.status(403).json({ message: "user is not owner of exam" });

            const { error, value } = putExamAccessControlRequestValidator.validate(req.body);
            if(error) throw error;

            const student = await db.users.findByPk(value.studentId);
            if(student === null) res.status(404).json({ message: "student not found" });

            const examAccessControl = await db.examAccessControls.findOrCreate({
                where: { applyeeId: value.studentId, examId }
            });

            examAccessControl.accessControl = value.accessControl;
            await examAccessControl[0].save();

            res.status(200).json({
                user: {
                    id: student.id,
                    name: student.name,
                    major: student.major
                },
                accessControl: value.accessControl
            });
        } catch (err) {
            next(err);
        }
    })

    router.post("/users/:userId/exams", authorize, async function(req, res, next) {
        try{
            const tokenUserId = res.locals.userId;
            const userId = req.params.userId;

            const { value, error } = postMyExamRequestValidator.validate(req.body);
            if(error) throw error;

            const user = await db.users.findByPk(userId);
            if(user === null) res.status(404).json({ message: "user not found" });
            const exam = await db.exams.findOne({
                where: { id: value.examId },
                include: [ { model: db.users, as: "owner" } ]
            });
            if(exam === null) res.status(404).json({ message: "exam not found" });
            if(tokenUserId !== userId) res.status(403).json({ message: "trying to add other users exam" });

            await user.addExam(exam);

            delete exam.dataValues.ownerId;
            delete exam.dataValues.owner.dataValues.password;
            delete exam.dataValues.owner.dataValues.role;

            res.status(200).json({
                exam
            });
        } catch(err) {
            next(err);
        }
    });

    router.get("/users/:userId/exams", authorize, async function(req, res, next) {
        try{
            const tokenUserId = res.locals.userId;
            const userId = req.params.userId;

            const user = await db.users.findByPk(userId);
            if(user === null) res.status(404).json({ message: "user not found" });
            if(tokenUserId !== userId) res.status(403).json({ message: "trying to get other users exam" });

            const exams = await user.getExams({
                include: [{ model: db.users, as: "owner" }]
            });

            res.status(200).json({
                exams: exams.map(exam => {
                    delete exam.dataValues.userExams;
                    delete exam.dataValues.ownerId;
                    delete exam.dataValues.owner.dataValues.password;
                    delete exam.dataValues.owner.dataValues.role;
                    return exam;
                })
            });
        } catch(err) {
            next(err);
        }
    });
};
