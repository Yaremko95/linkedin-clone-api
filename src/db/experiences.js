module.exports = (sequelize, DataTypes)=>{
    const Experience = sequelize.define(
        "experience",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },


        },
        {
            timestamps: false,
        }
    );
    Experience.associate = (models) => {
        Experience.belongsTo(models.User );
    };
    return Experience;
}