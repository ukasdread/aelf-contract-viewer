/**
 * @file contract list
 * @author atom-yang
 */
import React, { useState, useEffect } from 'react';
import Search from 'antd/lib/input/Search';
import 'antd/lib/input/style';
import {
  Divider,
  message,
  Pagination,
  Table,
  Tag
} from 'antd';
import useLocation from 'react-use/lib/useLocation';
import { request } from '../../../../common/request';
import { API_PATH } from '../../common/constants';
import config from '../../../../common/config';
import './index.less';
import { innerHeight, sendMessage } from '../../../../common/utils';


function removeAElfPrefix(name) {
  if (/^(AElf\.)(.*?)+/.test(name)) {
    return name.split('.')[name.split('.').length - 1];
  }
  return name;
}

const ListColumn = [
  {
    title: <span title="Contract Name">Contract Name</span>,
    dataIndex: 'contractName',
    key: 'contractName',
    ellipsis: true,
    width: 120,
    render: (name, record) => (name && +name !== -1 ? (
      <a
        href={`${config.viewer.viewerUrl}?address=${record.address}`}
        title={name}
      >
        {removeAElfPrefix(name)}
      </a>
    ) : '-')
  },
  {
    title: 'Contract Address',
    dataIndex: 'address',
    key: 'address',
    ellipsis: true,
    width: 320,
    render: address => (
      <a href={`${config.viewer.viewerUrl}?address=${address}`}>
        {`ELF_${address}_${config.viewer.chainId}`}
      </a>
    )
  },
  {
    title: <span title="Contract Type">Contract Type</span>,
    dataIndex: 'isSystemContract',
    key: 'isSystemContract',
    ellipsis: true,
    render: isSystemContract => (
      <Tag color={isSystemContract ? 'green' : 'blue'}>{isSystemContract ? 'System' : 'User'}</Tag>
    )
  },
  {
    title: 'Version',
    dataIndex: 'version',
    key: 'version'
  },
  {
    title: 'Author',
    dataIndex: 'author',
    key: 'author',
    ellipsis: true,
    width: 320,
    render: address => (
      <a
        href={`${config.viewer.addressUrl}/${address}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        {`ELF_${address}_${config.viewer.chainId}`}
      </a>
    )
  },
  {
    title: 'Last Updated At',
    dataIndex: 'updateTime',
    key: 'updateTime',
    width: 150
  }
];

const fetchingStatusMap = {
  FETCHING: 'fetching',
  ERROR: 'error',
  SUCCESS: 'success'
};

const Total = total => (
  <span>Total <span className="contract-list-total">{total}</span> Items</span>
);

const List = () => {
  const fullPath = useLocation();
  useEffect(() => {
    sendMessage({
      href: fullPath.href
    });
  }, [fullPath]);
  const [list, setList] = useState([]);
  const [fetchingStatus, setFetchingStatus] = useState(fetchingStatusMap.FETCHING);
  const [pagination, setPagination] = useState({
    total: 0,
    pageSize: 10,
    pageNum: 1
  });

  const getList = pager => {
    setFetchingStatus(fetchingStatusMap.FETCHING);
    request(API_PATH.GET_LIST, pager, {
      method: 'GET'
    }).then(result => {
      setFetchingStatus(fetchingStatusMap.SUCCESS);
      const {
        list: resultList,
        total
      } = result;
      setList(resultList);
      setPagination({
        ...pager,
        total
      });
    }).catch(e => {
      setFetchingStatus(fetchingStatusMap.ERROR);
      console.error(e);
      message.error('Network error');
    });
  };

  useEffect(() => {
    innerHeight().then(height => {
      sendMessage({ height });
    }).catch(err => {
      console.error(err);
    });
    getList(pagination);
  }, []);

  const onPageNumChange = (page, pageSize) => {
    const newPagination = {
      ...pagination,
      pageNum: page,
      pageSize
    };
    getList(newPagination);
  };

  const onSearch = value => {
    const newPagination = {
      ...pagination,
      pageNum: 1,
      address: value
    };
    getList(newPagination);
  };

  return (
    <div className="contract-list">
      <div className="contract-list-search">
        <h2>&nbsp;</h2>
        <Search
          className="contract-list-search-input"
          placeholder="Input contract address"
          size="large"
          onSearch={onSearch}
        />
      </div>
      <Divider />
      <div className="contract-list-content">
        <Table
          dataSource={list}
          columns={ListColumn}
          loading={fetchingStatus === fetchingStatusMap.FETCHING}
          rowKey="address"
          pagination={false}
        />
      </div>
      <div className="contract-list-pagination">
        <Pagination
          showQuickJumper
          total={pagination.total}
          current={pagination.pageNum}
          pageSize={pagination.pageSize}
          hideOnSinglePage
          onChange={onPageNumChange}
          showTotal={Total}
        />
      </div>
    </div>
  );
};

export default List;
