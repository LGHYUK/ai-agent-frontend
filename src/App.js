import React, { useState } from "react";
import { Routes, Route, Link, useNavigate } from "react-router-dom";
import "./App.css";
import CorrectPage from './Pages/Correct';
import WrongPage from './Pages/Wrong';
import MainPage from "./Pages/MainPage";
import RecordPage from "./Pages/RecordPage";
import { ProblemProvider, useProblem } from "./ProblemContext";
import { ResultProvider,useResult } from "./ResultContext";
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

/////////////// 메인화면 ///// /////////
function App() {
  const navigate = useNavigate();
  const { message, setMessage, setResponse } = useProblem(); // Context
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // useResult에서 실제로 쓰는 값만 꺼내야 no-unused-vars 경고가 안 납니다.
  const { resetAll } = useResult();

  // 드롭다운에서 선택된 레벨 (로컬 상태)
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [hintStep, setHintStep] = useState(0);
  const username = "testuser"
  const toggleSidebar = () => setIsSidebarOpen((v) => !v);

  // ★ 레벨 기반 문제 출제 API
  const fetchProblemByLevel = async () => {
    try {
      const res = await fetch(
        `http://localhost:8080/api/problems/random-by-level?level=${selectedLevel}&username=${encodeURIComponent(
          username
        )}`
      );
      if (res.status === 204) {
        setResponse({ reply: "선택한 레벨에 문제가 없습니다." });
        navigate("/main");
        return;
      }
      if (!res.ok) {
        const txt = await res.text();
        setResponse({ reply: `문제 로드 실패: ${txt}` });
        navigate("/main");
        return;
      }
      const text = await res.text(); // 서버가 문자열(문제 제목+요약) 반환
      setResponse({ reply: text, isProblem: true });
      navigate("/main");
    } catch (err) {
      console.error(err);
      setResponse({ reply: "문제 로드 실패(네트워크 오류)" });
      navigate("/main");
    }
  };

  const sendRequest = async () => {
    if (message.trim() === "") return;
    resetAll();
    try {
      const res = await fetch("http://localhost:8080/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "testuser",
          message: message,
        }),
      });
      //await fetch(`http://localhost:8080/api/problems/fetch?url=${encodeURIComponent(message)}`);

      const data = await res.json();
      setResponse(data); // Context에 저장
      
      //navigate("/main"); // 결과 페이지로 이동
      setTimeout(() => navigate("/main"), 50);
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
        <Link to="/" className="mainLink">
          CodeTalk 코드톡 
        </Link>
        <div className="nav">
          {/*<Link to="/mypage" className="subLink">마이페이지</Link>*/}
          
          

        </div>
      </header>

      {/* 사이드바 */}
      <div className={`sidebar ${isSidebarOpen ? "open" : ""}`}>
        <div className="sidebar-item">
          <Link to="/records" className="subLink" 
          onClick={toggleSidebar} >코드톡 소개</Link>
        </div>
        <div className="sidebar-item">
          <Link to="/RecordPage" className="subLink"
          onClick={toggleSidebar}>기록</Link>
        </div>
        <div className="sidebar-item">
          <Link to="/CorrectPage" className="subLink"
          onClick={toggleSidebar}>정답입니다</Link>
        </div>
        <div className="sidebar-item">
          <Link to="/WrongPage" className="subLink"
          onClick={toggleSidebar}>틀렸습니다</Link>
        </div>
      </div>

      <Routes>
        {/* 첫 화면 */}
        <Route
          path="/"
          element={
            <main className="Maincontainer">
              <div className="mainText">
                <h1>AI와 코딩 문제를 풀어보세요!</h1>
                <div className="M_input-area">
                  <label> 문제 난이도 선택: 
                    <select name="Level" 
                    value={selectedLevel} 
                    onChange={(e) => setSelectedLevel(Number(e.target.value))}>
                      {[...Array(9)].map((_, i) => (
                        <option key={i + 1} value={i + 1}>
                          레벨 {i + 1}
                        </option>
                      ))}
                    </select></label>
                  <input
                    type="text"
                    placeholder="문제를 입력하세요..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                </div>
                <button className="EnterBtn" onClick={fetchProblemByLevel}>
                  문제 풀이
                </button>
              </div>
            </main>
          }
        />

        {/* 다른 페이지 */}
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
