// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

contract StudentRegistry is AccessControl {
    bytes32 public constant TEACHER_ROLE = keccak256("TEACHER_ROLE");

    struct Record {
        bytes32 dataHash;
        address lastUpdatedBy;
        uint64 updatedAt;
        bool isActive;
    }

    mapping(bytes32 => Record) private records;

    event RecordAdded(bytes32 indexed studentIdHash, bytes32 dataHash, address indexed actor);
    event RecordUpdated(bytes32 indexed studentIdHash, bytes32 dataHash, address indexed actor);
    event RecordDeactivated(bytes32 indexed studentIdHash, address indexed actor);
    event TeacherGranted(address indexed account, address indexed grantedBy);
    event TeacherRevoked(address indexed account, address indexed revokedBy);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function version() external pure returns (string memory) {
        return "1.0.0";
    }

    function grantTeacher(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(TEACHER_ROLE, account);
        emit TeacherGranted(account, msg.sender);
    }

    function revokeTeacher(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _revokeRole(TEACHER_ROLE, account);
        emit TeacherRevoked(account, msg.sender);
    }

    function upsertRecord(bytes32 studentIdHash, bytes32 dataHash) external onlyRole(TEACHER_ROLE) {
        require(studentIdHash != bytes32(0), "studentIdHash required");
        require(dataHash != bytes32(0), "dataHash required");

        Record storage record = records[studentIdHash];
        bool isNew = record.updatedAt == 0;

        record.dataHash = dataHash;
        record.lastUpdatedBy = msg.sender;
        record.updatedAt = uint64(block.timestamp);
        record.isActive = true;

        if (isNew) {
            emit RecordAdded(studentIdHash, dataHash, msg.sender);
        } else {
            emit RecordUpdated(studentIdHash, dataHash, msg.sender);
        }
    }

    function deactivate(bytes32 studentIdHash) external onlyRole(TEACHER_ROLE) {
        Record storage record = records[studentIdHash];
        require(record.updatedAt != 0, "Record missing");
        require(record.isActive, "Record not active");

        record.isActive = false;
        record.lastUpdatedBy = msg.sender;
        record.updatedAt = uint64(block.timestamp);
        emit RecordDeactivated(studentIdHash, msg.sender);
    }

    function getRecord(bytes32 studentIdHash)
        external
        view
        returns (bytes32 dataHash, address lastUpdatedBy, uint64 updatedAt, bool isActive)
    {
        Record storage record = records[studentIdHash];
        return (record.dataHash, record.lastUpdatedBy, record.updatedAt, record.isActive);
    }

    function hasRecord(bytes32 studentIdHash) external view returns (bool) {
        return records[studentIdHash].updatedAt != 0;
    }
}
