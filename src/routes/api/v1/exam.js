const authorize = require("../../middleware/authorize");
const Joi = require("joi");
const db = require("../../../models");

const examQueryValidator = Joi.object({
    courseCode: Joi.string().max(50),
    courseName: Joi.string().max(50),
    limit: Joi.number().integer(),
    offset: Joi.number().integer(),
    title: Joi.string().max(50)
});

const postExamRequestValidator = Joi.object({
    title: Joi.string().max(50).required(),
    courseName: Joi.string().max(50).required(),
    courseCode: Joi.string().max(50).required(),
    startTime: Joi.string().isoDate().required(),
    endTime: Joi.string().isoDate().required()
})
module.exports = (router) => {
    router.get("/exams", authorize, async function(req, res, next) {
        try {
            const { value, error } = examQueryValidator.validate(req.query);
            if(error) throw error;

            const { limit, offset, ...query } = value;

            const exams = await db.exams.findAll({
                where: query,
                limit,
                offset,
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
            })
        } catch(err) {
            next(err);
        }
    });
};