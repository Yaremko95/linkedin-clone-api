module.exports = (sequelize, DataTypes)=>{
    const Reaction = sequelize.define(
        "reaction",
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
    Reaction.associate = (models) => {
        Reaction.belongsTo(models.User );
    };
    return Reaction;
}