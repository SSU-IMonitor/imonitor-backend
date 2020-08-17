module.exports = (sequelize, DataTypes) => {
    const modelName = "submits";
    const tableName = "submits";

    const Submits = sequelize.define(modelName, {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        submittedAnswer: { type: DataTypes.STRING(50), allowNull: false }
    }, { tableName, timestamp: false });

    Submits.associate = function(db) {
        db.submits.hasOne(db.qnas, { foreignKey: "qnaId", as: "qna", onDelete: "cascade", onUpdate: "cascade" });
    }

    return Submits;
}