/**
 * @file log in/out
 * @author atom-yang
 */
import React from 'react';
import PropTypes from 'prop-types';
import { useSelector, useDispatch } from 'react-redux';
import { If, Then, Else } from 'react-if';
import {
  Button,
  Dropdown,
  Menu,
  Icon
} from 'antd';
import { logOut, logIn } from '../../actions/common';
import {
  LOG_STATUS
} from '../../common/constants';

const OverLay = props => {
  const { address } = props;
  const dispatch = useDispatch();

  function handleLogout() {
    dispatch(logOut(address));
  }
  return (
    <Menu onClick={handleLogout}>
      <Menu.Item key="1">Logout</Menu.Item>
    </Menu>
  );
};
OverLay.propTypes = {
  address: PropTypes.string.isRequired
};


const LogButton = props => {
  const {
    isExist
  } = props;
  const common = useSelector(state => state.common);
  const {
    loading,
    logStatus,
    currentWallet
  } = common;
  const {
    name,
    address = ''
  } = currentWallet;
  const dispatch = useDispatch();

  const handleLogin = () => {
    dispatch(logIn());
  };

  return (
    <>
      <If condition={!!isExist}>
        <Then>
          <If condition={logStatus === LOG_STATUS.LOGGED}>
            <Then>
              <Dropdown overlay={<OverLay loading={loading} address={address} />}>
                <Button>
                  {name} <Icon type="down" />
                </Button>
              </Dropdown>
            </Then>
            <Else>
              <Button type="primary" loading={loading} onClick={handleLogin}>
                Login
              </Button>
            </Else>
          </If>
        </Then>
      </If>
    </>
  );
};

LogButton.propTypes = {
  isExist: PropTypes.bool.isRequired
};

export default LogButton;