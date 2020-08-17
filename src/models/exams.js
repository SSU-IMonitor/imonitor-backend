module.exports = (sequelize, DataTypes) => {
    const modelName = "exams";
    const tableName = "exams";

    const Exams = sequelize.define(modelName, {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        title: { type: DataTypes.STRING(50), allowNull: false },
        courseName: { type: DataTypes.STRING(50), allowNull: false },
        courseCode: { type: DataTypes.STRING(50), allowNull: false },
        startTime: { type: DataTypes.DATE, allowNull: false },
        endTime: { type: DataTypes.DATE, allowNull: false }
    })

    Exams.associate = function(db) {
        db.exams.belongsTo(db.users, { foreignKey: "ownerId", as: "owner" })
    }

    return Exams;
}