module.exports = (sequelize, DataTypes) => {
    const modelName = "exampAccessControls";
    const tableName = "exam_access_controls";

    const ExamAccessControls = sequelize.define(modelName, {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        isAccepted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false }
    });

    ExamAccessControls.associate = function(db) {
        db.examAccessControls.belongsTo(db.exams, { foreignKey: "examId", as: "exam", onDelete: "cascade", onUpdate: "cascade" });
        db.examAccessControls.belongsTo(db.users, { foreignKey: "applyeeId", as: "applyee", onDelete: "cascade", onUpdate: "cascade" });
    }

    return ExamAccessControls;
}