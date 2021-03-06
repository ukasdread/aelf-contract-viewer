/**
 * @file organization related formatters
 * @author atom-yang
 */
const Decimal = require('decimal.js');
const {
  Proposers
} = require('viewer-orm/model/proposers');
const {
  sequelize
} = require('viewer-orm/common/viewer');
const {
  Organizations
} = require('viewer-orm/model/organizations');
const {
  Tokens
} = require('viewer-orm/model/tokens');
const {
  deserializeLogs
} = require('../utils');
const config = require('../config');

async function organizationCreatedFormatter(transaction) {
  const {
    Logs = [],
    TransactionId,
    Transaction,
    time
  } = transaction;
  const {
    From
  } = Transaction;
  const logResults = await deserializeLogs(Logs, 'OrganizationCreated');
  return Promise.all(logResults.map(log => {
    const {
      deserializeLogResult,
      contractAddress
    } = log;
    const {
      organizationAddress
    } = deserializeLogResult;
    const proposalType = config.constants.addressProposalTypesMap[contractAddress];
    return config.contracts[proposalType.toLowerCase()]
      .contract.GetOrganization.call(organizationAddress)
      .then(org => {
        const {
          organizationAddress: orgAddress,
          organizationHash: orgHash,
          proposalReleaseThreshold: releaseThreshold,
          ...leftOrgInfo
        } = org;
        return {
          orgAddress,
          orgHash,
          releaseThreshold,
          leftOrgInfo,
          createdAt: time,
          proposalType,
          creator: From,
          txId: TransactionId
        };
      });
  }));
}

async function organizationCreatedInserter(formattedData) {
  return sequelize.transaction(t => Promise.all(formattedData.map(async item => {
    // eslint-disable-next-line prefer-const
    const {
      orgAddress,
      proposalType,
      leftOrgInfo,
      txId
    } = item;
    const isExist = await Organizations.isExist(orgAddress);
    if (isExist) {
      return false;
    }
    if (proposalType !== config.constants.proposalTypes.PARLIAMENT) {
      let { releaseThreshold } = item;
      if (proposalType === config.constants.proposalTypes.REFERENDUM) {
        const { tokenSymbol } = leftOrgInfo;
        const decimal = await Tokens.getTokenDecimal(tokenSymbol);
        releaseThreshold = Object.entries(releaseThreshold).reduce((acc, [key, value]) => ({
          ...acc,
          [key]: new Decimal(value).dividedBy(`1e${decimal}`)
        }), {});
      }
      const {
        proposerWhiteList
      } = leftOrgInfo;
      let {
        proposers
      } = proposerWhiteList;
      proposers = proposers.map(v => ({
        orgAddress,
        proposer: v,
        proposalType,
        relatedTxId: txId
      }));
      return Promise.all([
        Organizations.create({
          ...item,
          releaseThreshold
        }, { transaction: t }),
        Proposers.bulkCreate(proposers, { transaction: t })
      ]);
    }
    return Organizations.create(item, { transaction: t });
  })));
}

async function organizationCreatedInsert(transaction) {
  const formattedData = await organizationCreatedFormatter(transaction);
  return organizationCreatedInserter(formattedData);
}


async function organizationUpdatedInsert(transaction) {
  const {
    Logs = [],
    TransactionId,
    time
  } = transaction;
  const logResults = [
    ...(await deserializeLogs(Logs, 'OrganizationWhiteListChanged')),
    ...(await deserializeLogs(Logs, 'OrganizationMemberChanged')),
    ...(await deserializeLogs(Logs, 'OrganizationThresholdChanged'))
  ];
  return sequelize.transaction(t => Promise.all(logResults.map(async log => {
    const {
      contractAddress,
      deserializeLogResult,
      name
    } = log;
    const {
      organizationAddress
    } = deserializeLogResult;
    const proposalType = config.constants.addressProposalTypesMap[contractAddress];
    const { contract } = config.contracts[proposalType.toLowerCase()];
    const orgInfo = await contract.GetOrganization.call(organizationAddress);
    const {
      organizationAddress: orgAddress,
      organizationHash: orgHash,
      proposalReleaseThreshold,
      ...leftOrgInfo
    } = orgInfo;

    let releaseThreshold = proposalReleaseThreshold;
    if (proposalType === config.constants.proposalTypes.REFERENDUM) {
      const { tokenSymbol } = leftOrgInfo;
      const decimal = await Tokens.getTokenDecimal(tokenSymbol);
      releaseThreshold = Object.entries(releaseThreshold).reduce((acc, [key, value]) => ({
        ...acc,
        [key]: new Decimal(value).dividedBy(`1e${decimal}`)
      }), {});
    }

    if (name === 'OrganizationWhiteListChanged') {
      const {
        proposerWhiteList
      } = leftOrgInfo;
      const proposers = proposerWhiteList.proposers.map(v => ({
        orgAddress,
        proposer: v,
        proposalType,
        relatedTxId: TransactionId
      }));
      // 不可在事务中删除
      await Proposers.destroy({
        where: {
          orgAddress
        }
      });
      return Promise.all([
        Organizations.update({
          orgHash,
          releaseThreshold,
          leftOrgInfo,
          updatedAt: time
        }, {
          where: {
            orgAddress
          },
          transaction: t
        }),
        Proposers.bulkCreate(proposers, { transaction: t })
      ]);
    }
    return Organizations.update({
      orgHash,
      releaseThreshold,
      leftOrgInfo
    }, {
      where: {
        orgAddress
      },
      transaction: t
    });
  })));
}

module.exports = {
  organizationCreatedInsert,
  organizationUpdatedInsert,
  organizationCreatedInserter
};
