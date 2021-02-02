module.exports = (sequelize, DataTypes)=>{
    const Comment = sequelize.define(
        "comment",
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
    Comment.associate = (models) => {
        Comment.belongsTo(models.User );
    };
    return Comment;
}