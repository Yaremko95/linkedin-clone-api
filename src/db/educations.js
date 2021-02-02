module.exports = (sequelize, DataTypes)=>{
    const Education = sequelize.define(
        "education",
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
    Education.associate = (models) => {
        Education.belongsTo(models.User );
    };
    return Education;
}