module.exports = (sequelize, DataTypes) => {
  const Conversation = sequelize.define(
    "conversation",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: DataTypes.INTEGER,
      },
    },
    {
      timestamps: false,
    }
  );
  Conversation.associate = (models) => {
    Conversation.belongsTo(models.User, {
      foreignKey: "userId",
      as: "createdBy",
    });
    Conversation.hasMany(models.Message);
    Conversation.hasMany(models.Participant);
    Conversation.belongsToMany(models.User, {
      through: models.Participant,
      as: "parts",
    });
  };
  return Conversation;
};
