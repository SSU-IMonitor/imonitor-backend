module.exports = (sequelize, DataTypes) => {
    const modelName = "answerChoices";
    const tableName = "answer_choices";

    const AnswerChoices = sequelize.define(modelName, {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        order: { type: DataTypes.INTEGER, allowNull: false },
        content: { type: DataTypes.STRING(50), allowNull: false }
    });

    return AnswerChoices;
}