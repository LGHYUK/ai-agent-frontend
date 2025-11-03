import React, { useState, useEffect } from "react";
import "./RecordPage.css";
import { useNavigate } from "react-router-dom";
import { useProblem } from "../ProblemContext";

export default function RecordPage() {
  const navigate = useNavigate();
  const { setResponse } = useProblem();
  const username = "testuser";

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  // 목록 로드
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`http://localhost:8080/api/sessions?username=${encodeURIComponent(username)}`);
        const data = await res.json();
        setRecords(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
        setRecords([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [username]);

  // 다시보기
  const onReplay = async (id) => {
    try {
      const res = await fetch(`http://localhost:8080/api/problems/by-session?sessionId=${id}`);
      if (!res.ok) return;
      const text = await res.text();

      // 세션ID 저장 (이후 힌트/정답 카운트에 사용)
      sessionStorage.setItem("sessionId", id);

      // 문제 복원
      setResponse({ reply: text, isProblem: true });
      navigate("/main");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="Recode-container">
      <div className="main-wrapper">
        <div className="chat-container">
          <div className="page-header">
            <h2 className="page-title">대화 기록</h2>
          </div>

          {loading && <p style={{ padding: 16 }}>불러오는 중...</p>}

          <div className="records-container">
            {records.map((r) => (
              <div key={r.id} className="RecordBox">
                <div className="record-header">
                  <div className="level-badge">레벨 {r.difficulty ?? "-"}</div>
                  <div className={`status-badge ${r.solved ? 'solved' : 'pending'}`}>
                    {r.solved ? '✓ 성공' : ' 실패 '}
                  </div>
                </div>

                <h3 className="record-title">{r.title ?? "제목 없음"}</h3>

                <div className="record-footer">
                  <div className="record-info">
                    <span className="info-item">
                      📅 {r.createdAt ? new Date(r.createdAt).toLocaleString() : "-"}
                    </span>
                    <span className="info-item">
                      🔄 {(r.hintsUsed ?? 0)}번 시도
                    </span>
                  </div>
                  <button className="view-button" onClick={() => onReplay(r.id)}>
                    다시보기
                  </button>
                </div>
              </div>
            ))}
          </div>

          {(!loading && records.length === 0) && (
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
