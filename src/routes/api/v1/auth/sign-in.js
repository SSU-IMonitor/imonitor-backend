const Joi = require("joi");
const db = require("../../../../models");
const jwt = require("jsonwebtoken");

const signInRequestValidator = Joi.object({
    id: Joi.string().min(8).max(8).required(),
    password: Joi.string().max(64).required(),
});

module.exports = (router) => {
    router.post("/auth/sign-in", async function(req, res, next) {
        try{
            const { value, error } = signInRequestValidator.validate(req.body);
            if(error) throw error;

            const user = await db.users.findOne({
                where: { ...value }
            });

            if(user === null) res.status(404).json({ message: "User Not Found" });

            const accessToken = jwt.sign({
                userId: user.id
            }, "secret", { expiresIn: "7d" });

            const refreshToken = jwt.sign({
                userId: user.id
            }, "secret", { expiresIn: "14d" });

            const tokenType = "Bearer";

            res.status(200).json({
                accessToken,
                refreshToken,
                tokenType,
                userInfo: {
                    id: user.id,
                    name: user.name,
                    major: user.major
                }
            });
        } catch(err) {
            next(err);
        }
    });
}