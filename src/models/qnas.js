module.exports = (sequelize, DataTypes) => {
    const modelName = "qnas";
    const tableName = "qnas";

    const Qnas = sequelize.define(modelName, {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        question: { type: DataTypes.STRING(150), allowNull: false },
        answer: { type: DataTypes.STRING(50), allowNull: false },
        type: { type: DataTypes.ENUM("CHOICE", "SHORT_ANSWER") }
    }, { tableName, timestamps: false });

    Qnas.associate = function(db) {
        db.qnas.belongsTo(db.exams, { foreignKey: "examId", as: "exam", onDelete: "cascade", onUpdate: "cascade" });
        db.qnas.hasMany(db.answerChoices, { foreignKey: "qnaId", as: "qna", onDelete: "cascade", onUpdate: "cascade" });
    }

    return Qnas;
}