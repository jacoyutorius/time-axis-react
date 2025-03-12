import React, { createContext, useContext, useReducer, useEffect } from 'react';
import initialRecords from '../data/records.json';

// コンテキストの作成
const RecordsContext = createContext();

// アクションタイプ
const SET_RECORDS = 'SET_RECORDS';
const ADD_RECORD = 'ADD_RECORD';
const UPDATE_RECORD = 'UPDATE_RECORD';
const DELETE_RECORD = 'DELETE_RECORD';
const TOGGLE_SELECTED = 'TOGGLE_SELECTED';

// レデューサー
const recordsReducer = (state, action) => {
  switch (action.type) {
    case SET_RECORDS:
      return {
        ...state,
        records: action.payload.map(record => ({
          ...record,
          selected: false
        }))
      };
    case ADD_RECORD:
      return {
        ...state,
        records: [...state.records, action.payload]
      };
    case UPDATE_RECORD:
      return {
        ...state,
        records: state.records.map(record =>
          record.id === action.payload.id ? action.payload : record
        )
      };
    case DELETE_RECORD:
      return {
        ...state,
        records: state.records.filter(record => record.id !== action.payload.id)
      };
    case TOGGLE_SELECTED:
      return {
        ...state,
        records: state.records.map(record =>
          record.id === action.payload.id
            ? { ...record, selected: !record.selected }
            : record
        )
      };
    default:
      return state;
  }
};

// プロバイダーコンポーネント
export const RecordsProvider = ({ children }) => {
  const [state, dispatch] = useReducer(recordsReducer, { records: [] });

  // 初期データの読み込み
  useEffect(() => {
    const loadRecords = () => {
      const savedRecords = localStorage.getItem('timeAxisRecords');
      const records = savedRecords ? JSON.parse(savedRecords) : initialRecords;
      dispatch({ type: SET_RECORDS, payload: records });
    };

    loadRecords();
  }, []);

  // アクション
  const scanRecords = () => {
    const savedRecords = localStorage.getItem('timeAxisRecords');
    const records = savedRecords ? JSON.parse(savedRecords) : initialRecords;
    dispatch({ type: SET_RECORDS, payload: records });
  };

  const postRecord = (record) => {
    try {
      const savedRecords = localStorage.getItem('timeAxisRecords');
      const records = savedRecords ? JSON.parse(savedRecords) : initialRecords;

      records.push(record);
      localStorage.setItem('timeAxisRecords', JSON.stringify(records));

      dispatch({ type: ADD_RECORD, payload: record });
      return { success: true };
    } catch (e) {
      console.error(e);
      return { error: { code: 'ERROR', message: e.message } };
    }
  };

  const putRecord = (record) => {
    try {
      const savedRecords = localStorage.getItem('timeAxisRecords');
      const records = savedRecords ? JSON.parse(savedRecords) : initialRecords;

      const index = records.findIndex(r => r.id === record.id);

      if (index !== -1) {
        records[index] = record;
        localStorage.setItem('timeAxisRecords', JSON.stringify(records));

        dispatch({ type: UPDATE_RECORD, payload: record });
        return { success: true };
      } else {
        return { error: { code: 'NOT_FOUND', message: 'Record not found' } };
      }
    } catch (e) {
      console.error(e);
      return { error: { code: 'ERROR', message: e.message } };
    }
  };

  const deleteRecord = (record) => {
    try {
      const savedRecords = localStorage.getItem('timeAxisRecords');
      const records = savedRecords ? JSON.parse(savedRecords) : initialRecords;

      const index = records.findIndex(r => r.id === record.id);

      if (index !== -1) {
        records.splice(index, 1);
        localStorage.setItem('timeAxisRecords', JSON.stringify(records));

        dispatch({ type: DELETE_RECORD, payload: record });
        return { success: true };
      } else {
        return { error: { code: 'NOT_FOUND', message: 'Record not found' } };
      }
    } catch (e) {
      console.error(e);
      return { error: { code: 'ERROR', message: e.message } };
    }
  };

  const toggleSelected = (record) => {
    dispatch({ type: TOGGLE_SELECTED, payload: record });

    // 元のVuexストアの動作を模倣するために200msの遅延を設ける
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, 200);
    });
  };

  // ゲッター
  const getters = {
    records: state.records,
    chartData: state.records.filter(record => record.selected),
    peoples: state.records.filter(record => record.category === 'people'),
    organizations: state.records.filter(record => record.category === 'organization'),
    eventData: state.records
      .filter(record => record.selected)
      .map((record, i) =>
        record.events.map(event => ({
          title: record.title,
          content: event.content,
          top: record.top,
          start: event.start,
          baseIndex: i
        }))
      )
      .flat(),
    areaStartYear: () => {
      const selectedRecords = state.records.filter(record => record.selected);
      const startYears = selectedRecords.map(record => record.start);
      return startYears.length > 0 ? Math.min(...startYears) - 10 : 0;
    },
    areaEndYear: () => {
      const selectedRecords = state.records.filter(record => record.selected);
      const endYears = selectedRecords.map(record =>
        record.end === undefined || record.end === 0
          ? new Date().getFullYear()
          : record.end
      );
      if (endYears.length <= 0) {
        return 0;
      }
      const maxYear = Math.max(...endYears);
      return (maxYear === 0 ? new Date().getFullYear() : maxYear) + 10;
    }
  };

  return (
    <RecordsContext.Provider
      value={{
        ...state,
        ...getters,
        scanRecords,
        postRecord,
        putRecord,
        deleteRecord,
        toggleSelected
      }}
    >
      {children}
    </RecordsContext.Provider>
  );
};

// カスタムフック
export const useRecords = () => {
  const context = useContext(RecordsContext);
  if (context === undefined) {
    throw new Error('useRecords must be used within a RecordsProvider');
  }
  return context;
};
