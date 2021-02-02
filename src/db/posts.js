module.exports = (sequelize, DataTypes)=>{
    const Post = sequelize.define(
        "post",
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
    Post.associate = (models) => {
        Post.belongsTo(models.User );
    };
    return Post;
}