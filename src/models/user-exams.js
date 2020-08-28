module.exports = (sequelize, DataTypes) => {
    const modelName = "userExams";
    const tableName = "user_exams";

    const UserExams = sequelize.define(modelName, {}, { timestamps: false, tableName });

    return UserExams;
}