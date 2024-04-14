import { createAsyncThunk } from '@reduxjs/toolkit';
import { UndoableAction } from './undoableAction';

describe('UndoableAction', () => {
  describe('create', () => {
    test('should create an action with the correct type and payload', () => {
      const actionCreator = (arg: any) => ({ type: 'TEST_ACTION', payload: arg });
      const arg = { key: 'value' };
      const undoableAction = new UndoableAction(actionCreator, arg);
      const result = undoableAction.create();

      expect(result.action).toStrictEqual({ type: 'TEST_ACTION', payload: arg });
      expect(result.actionTypes).toStrictEqual(new Set(['TEST_ACTION']));
      expect(result.isAsync).toBe(false);
    });

    test('should create an async action with the correct types and payload', () => {
      const asyncActionCreator = createAsyncThunk('TEST_THUNK', async () => {})
      const arg = { key: 'value' };
      const undoableAction = new UndoableAction(asyncActionCreator, arg);
      const result = undoableAction.create();

      expect(result.actionTypes).toStrictEqual(new Set([asyncActionCreator.fulfilled.toString(), asyncActionCreator.rejected.toString()]));
      expect(result.pendingType).toBe(asyncActionCreator.pending.toString());
      expect(result.isAsync).toBe(true);
    });
  });
});
