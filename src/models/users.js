module.exports = (sequelize, DataTypes) => {
    const modelName = "users";
    const tableName = "users";

    const Users = sequelize.define(modelName, {
        id: { type: DataTypes.STRING("8"), primaryKey: true, allowNull: false },
        name: { type: DataTypes.STRING(64), allowNull: false },
        password: { type: DataTypes.STRING(64), allowNull: false },
        major: { type: DataTypes.STRING(64), allowNull: false },
        role: { type: DataTypes.ENUM("APPLIER", "EXAMIER"), allowNull: false, defaultValue: "APPLIER" }
    }, { tableName, timestamps: false });

    Users.associate = function(db) {
        db.users.belongsToMany(db.exams, { through: db.userExams, as: "exams" });
    }
    return Users;
}