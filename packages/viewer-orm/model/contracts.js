/**
 * @file contracts model
 * @author atom-yang
 */
const Sequelize = require('sequelize');
const { commonModelOptions } = require('../common');

const {
  Model,
  BIGINT,
  STRING,
  BOOLEAN,
  DATE,
  NOW,
  col,
  Op
} = Sequelize;

const contractsDescription = {
  id: {
    type: BIGINT,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
    field: 'id'
  },
  address: {
    type: STRING(64),
    allowNull: false,
    field: 'address',
    comment: 'contract address'
  },
  author: {
    type: STRING(64),
    allowNull: false,
    field: 'author',
    comment: 'contract author'
  },
  category: {
    type: STRING(12),
    allowNull: false,
    field: 'category',
    comment: 'the category of contract'
  },
  isSystemContract: {
    type: BOOLEAN,
    allowNull: false,
    field: 'is_system_contract',
    comment: 'is system contract or not'
  },
  serial: {
    type: STRING(12),
    allowNull: false,
    field: 'serial',
    comment: 'the serial number of contract'
  },
  updateTime: {
    type: DATE,
    allowNull: false,
    defaultValue: NOW,
    field: 'update_time'
  }
};

class Contracts extends Model {
  static getInfoByAddress(address) {
    return Contracts.findAll({
      where: {
        address: {
          [Op.substring]: address
        }
      }
    });
  }

  static async getList(params) {
    const {
      pageSize,
      pageNum,
      address = ''
    } = params;
    const result = await Contracts.findAndCountAll({
      where: {
        address: {
          [Op.substring]: address
        }
      },
      order: [
        [col('updateTime'), 'DESC'],
        ['id', 'DESC']
      ],
      offset: (pageNum - 1) * pageSize,
      limit: pageSize
    });
    const total = result.count;
    const list = result.rows.map(v => v.toJSON());
    return {
      total,
      list
    };
  }
}

Contracts.init(contractsDescription, {
  ...commonModelOptions,
  tableName: 'contracts'
});

module.exports = {
  Contracts,
  contractsDescription
};