'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class TblProjectGeo extends Model {
    static associate(models) {
      TblProjectGeo.belongsTo(models.TblFolderProject, {
        foreignKey: 'uuid_folder',
        targetKey: 'uuid',
        as: 'folder'
      });
      TblProjectGeo.belongsTo(models.DetailUsers, {
        foreignKey: 'uuid_user',
        targetKey: 'uuid',
        as: 'user'
      });
      TblProjectGeo.hasMany(models.TblGeometryProject, {
        foreignKey: 'uuid_project_geo',
        sourceKey: 'uuid',
        as: 'geometries'
      });
    }
  }

  TblProjectGeo.init({
    uuid: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    detail: {
      type: DataTypes.STRING,
      allowNull: true
    },
    uuid_folder: {
      type: DataTypes.UUID,
      allowNull: false
    },
    uuid_user: {
      type: DataTypes.UUID,
      allowNull: false
    },
    kode_provinsi: {
      type: DataTypes.STRING,
      allowNull: false
    },
    nama_provinsi: {
      type: DataTypes.STRING,
      allowNull: true
    },
    kode_kabupaten: {
      type: DataTypes.STRING,
      allowNull: false
    },
    nama_kabupaten: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'TblProjectGeo',
    tableName: 'tbl_project_geo',
    timestamps: true
  });

  return TblProjectGeo;
};
