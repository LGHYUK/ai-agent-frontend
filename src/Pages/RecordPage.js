import React, { useState, useEffect } from "react";
import "./RecordPage.css";
import { useNavigate } from "react-router-dom";

export default function RecordPage() {
  const navigate = useNavigate();
  
  // 더미 데이터 (나중에 실제 데이터로 교체)
  const records = [
    {
      id: 1,
      level: 1,
      title: "Hello World 출력하기",
      date: "2024.11.02",
      solved: true,
      attempts: 3
    },
    {
      id: 2,
      level: 1,
      title: "두 수의 합 구하기",
      date: "2024.11.01",
      solved: true,
      attempts: 2
    },
    {
      id: 3,
      level: 2,
      title: "배열 최댓값 찾기",
      date: "2024.10.31",
      solved: false,
      attempts: 5
    }
  ];

  return (
    <div className="Recode-container">
      <div className="main-wrapper">
        <div className="chat-container">
          <div className="page-header">
            <h2 className="page-title">대화 기록</h2>
          </div>

          <div className="records-container">
            {records.map((record) => (
              <div key={record.id} className="RecordBox">
                <div className="record-header">
                  <div className="level-badge">
                    레벨 {record.level}
                  </div>
                  <div className={`status-badge ${record.solved ? 'solved' : 'pending'}`}>
                    {record.solved ? '✓ 성공' : ' 실패 '}
                  </div>
                </div>

                <h3 className="record-title">{record.title}</h3>

                <div className="record-footer">
                  <div className="record-info">
                    <span className="info-item">
                      📅 {record.date}
                    </span>
                    <span className="info-item">
                      🔄 {record.attempts}번 시도
                    </span>
                  </div>
                  <button 
                    className="view-button"
                    onClick={() => navigate(`/problem/${record.id}`)}
                  >
                    다시보기
                  </button>
                </div>
              </div>
            ))}
          </div>

          {records.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">📝</div>
              <p className="empty-text">아직 기록이 없어요!</p>
              <p className="empty-subtext">문제를 풀고 첫 기록을 남겨보세요</p>
            </div>
          )}
        </div>
      </div>
  </div>
  );
}