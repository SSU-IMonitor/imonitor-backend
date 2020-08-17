const authorize = require("../../middleware/authorize");
const Joi = require("joi");
const db = require("../../../models");

const postExamRequestValidator = Joi.object({
    title: Joi.string().max(50).required(),
    courseName: Joi.string().max(50).required(),
    courseCode: Joi.string().max(50).required(),
    startTime: Joi.string().isoDate().required(),
    endTime: Joi.string().isoDate().required()
})
module.exports = (router) => {
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