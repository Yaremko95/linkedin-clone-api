module.exports = (sequelize, DataTypes) => {
  const Message = sequelize.define("message", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    text: { type: DataTypes.TEXT, allowNull: false },
  });
  Message.associate = (models) => {
    Message.belongsTo(models.User);
    Message.belongsTo(models.Conversation);
  };
  return Message;
};
