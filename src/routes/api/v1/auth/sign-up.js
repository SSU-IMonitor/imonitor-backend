const Joi = require("joi");
const db = require("../../../../models");
const jwt = require("jsonwebtoken");

const signUpRequestValidator = Joi.object({
    id: Joi.string().min(8).max(8).required(),
    name: Joi.string().max(50).required(),
    password: Joi.string().max(64).required(),
    major: Joi.string().required()
});

module.exports = (router) => {
    router.post("/auth/sign-up", async function(req, res, next) {
        try{
            const { value, error } = signUpRequestValidator.validate(req.body);
            if(error) throw error;

            const newUser = await db.users.create(value);

            const accessToken = jwt.sign({
                userId: newUser.id
            }, "secret", { expiresIn: "7d" });

            const refreshToken = jwt.sign({
                userId: newUser.id
            }, "secret", { expiresIn: "14d" });

            const tokenType = "Bearer";

            res.status(201).json({
                accessToken,
                refreshToken,
                tokenType,
                userInfo: {
                    id: newUser.id,
                    name: newUser.name,
                    major: newUser.major
                }
            });
        } catch(err) {
            next(err);
        }
    });
}