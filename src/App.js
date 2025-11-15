import React, { useState, useEffect } from "react";
import { Routes, Route, Link, useNavigate } from "react-router-dom";
import "./App.css";
import CorrectPage from './Pages/Correct';
import WrongPage from './Pages/Wrong';
import MainPage from "./Pages/MainPage";
import RecordPage from "./Pages/RecordPage";
import { ProblemProvider, useProblem } from "./ProblemContext";
import { ResultProvider, useResult } from "./ResultContext";
import menuIcon from "./Icon/menu.png";

function AppWrapper() {
  return (
    <ProblemProvider>
      <ResultProvider>
        <App />
      </ResultProvider>
    </ProblemProvider>
  );
}

function App() {
  const navigate = useNavigate();
  const { message, setMessage, setResponse } = useProblem();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { hint, correct, timer, level, resetAll, selectedLevel, setSelectedLevel } = useResult(); // 힌트 사용한 횟수,정답 보낸 횟수 ,소요시간 세서 정답 페이지로 보내는 전역변수
  

  const userId = 1;

  // 앱 처음 로딩 시, 사용자 레벨을 백엔드에서 읽어와서 selectedLevel 세팅
  useEffect(() => {
    const loadUserLevel = async () => {
      try {
        const res = await fetch(`http://localhost:8080/api/users/${userId}/level`);
        if (!res.ok) {
          console.error("레벨 조회 실패:", res.status);
          return;
        }
        const level = await res.json();   // 예: 3
        console.log("서버에서 받아온 level =", level);
        setSelectedLevel(level);
      } catch (e) {
        console.error("레벨 로드 중 오류:", e);
      }
    };

    loadUserLevel();
  }, [userId, setSelectedLevel]);

  const toggleSidebar = () => setIsSidebarOpen(v => !v);

  // 레벨 기반 문제 출제 (세션ID를 응답 헤더로 수신)
  const fetchProblemByLevel = async () => {
    try {
      const res = await fetch(
        `http://localhost:8080/api/problems/random-by-level?level=${selectedLevel}&userId=${userId}`
      );

      if (res.status === 204) {
        setResponse({ reply: "선택한 레벨에 문제가 없습니다.", isProblem: true });
        navigate("/main");
        return;
      }

      if (!res.ok) {
        const txt = await res.text();
        setResponse({ reply: `문제 로드 실패: ${txt}`, isProblem: true });
        navigate("/main");
        return;
      }

      // 세션ID 저장 (힌트/시도/정답 기록에 사용)
      const sid = res.headers.get("X-Session-Id");
      if (sid) {
        sessionStorage.setItem("sessionId", sid);
      }

      const text = await res.text(); // 문제 표시 문자열
      setResponse({ reply: text, isProblem: true });
      console.log("보내는 userId :", userId);
      resetAll(); // 전역 상태 초기화
      navigate("/main");
    } catch (err) {
      console.error(err);
      setResponse({ reply: "문제 로드 실패(네트워크 오류)", isProblem: true });
      navigate("/main");
    }
  };

  // (기존) 일반 대화
  const sendRequest = async () => {
    if (message.trim() === "") return;
    resetAll();
    try {
      const res = await fetch("http://localhost:8080/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userID, message }),
      });
      const data = await res.json();
      setResponse(data);
      navigate("/main");
    } catch (err) {
      console.error("API 호출 실패:", err);
    }
  };

  return (
    <div className="app-container">
      <header className="header">
        <img
          src={menuIcon}
          alt="아이콘"
          className="menu-icon"
          onClick={toggleSidebar}
        />
        <Link to="/" className="mainLink">CodeTalk 코드톡</Link>
        <div className="nav" />
      </header>

      {/* 사이드바 */}
      <div className={`sidebar ${isSidebarOpen ? "open" : ""}`}>
        <div className="sidebar-item">
          <Link to="/records" className="subLink" onClick={toggleSidebar}>코드톡 소개</Link>
        </div>
        <div className="sidebar-item">
          <Link to="/RecordPage" className="subLink" onClick={toggleSidebar}>기록</Link>
        </div>
        <div className="sidebar-item">
          <Link to="/CorrectPage" className="subLink" onClick={toggleSidebar}>정답입니다</Link>
        </div>
        <div className="sidebar-item">
          <Link to="/WrongPage" className="subLink" onClick={toggleSidebar}>틀렸습니다</Link>
        </div>
      </div>

      <Routes>
        {/* 첫 화면 */}
        <Route
          path="/"
          element={
            <main className="Maincontainer">
              <div className="mainText">
                <h1>AI와 함께하는 인터랙티브 코딩 챌린지</h1>
                <p> 대화로 배우는 코딩, AI와 함께 성장하세요</p>
                <div className="M_input-area">
                  <label>
                    문제 난이도 선택:&nbsp;
                    <select
                      name="Level"
                      value={selectedLevel}
                      onChange={(e) => setSelectedLevel(Number(e.target.value))}
                    >
                      {[...Array(8)].map((_, i) => (
                        <option key={i + 1} value={i + 1}>
                          레벨 {i + 1}
                        </option>
                      ))}
                    </select>
                  </label>
                  
                </div>
                <button className="EnterBtn" onClick={fetchProblemByLevel}>
                  문제 풀이
                </button>
              </div>
            </main>
          }
        />

        <Route path="/main" element={<MainPage />} />
        <Route path="/mypage" element={<div>마이페이지</div>} />
        <Route path="/CorrectPage" element={<CorrectPage />} />
        <Route path="/WrongPage" element={<WrongPage />} />
        <Route path="/RecordPage" element={<RecordPage />} />
      </Routes>
    </div>
  );
}

export default AppWrapper;
