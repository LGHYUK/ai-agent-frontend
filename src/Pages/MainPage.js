import React, { useEffect, useState, useRef } from "react";
import "./MainPage.css";
import { useProblem } from "../ProblemContext";
import { useResult } from "../ResultContext";
import CCodeEditor from './CCodeEditor';
import { useNavigate } from "react-router-dom";

export default function MainPage() {
  const navigate = useNavigate();
  const { response, setResponse } = useProblem();
  const { hint, correct } = useResult();

  const [isLoading, setIsLoading] = useState(false);
  const [isNoticeOpen, setIsNoticeOpen] = useState(true);
  const [problemText, setProblemText] = useState("");
  const [Chat, setChat] = useState([]);
  const [b, setB] = useState(3);          // 남은 힌트 횟수
  const [active, SetActive] = useState(false);

  const chatEndRef = useRef(null);

  const username = "testuser"; // 데모용 고정

  const cleanText = (text) => {
    if (!text) return "";
    return text
      .replace(/\\n/g, '\n\n')
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&le;/g, '≤')
      .replace(/&ge;/g, '≥')
      .replace(/"/g, '');
  };

  // 문제 수신 시 문제 영역 고정 및 카운터 리셋
  useEffect(() => {
    if (response?.isProblem) {
      setProblemText(cleanText(response.reply));
      setChat([]);
      setB(3);
      SetActive(false);
      hint.setHintnum(0);
      correct.setCorrectnum(0);
    }
  }, [response, hint, correct]);

  // 정답/오답 페이지 이동
  useEffect(() => {
    if (typeof response === 'string' && response.includes("정답입니다.")) {
      navigate("/CorrectPage");
    } else if (correct.Correctnum >= 3 && typeof response === 'string' && response.includes("틀렸습니다.")) {
      navigate("/WrongPage");
    }
    if (response?.reply?.includes("정답입니다.")) {
      navigate("/CorrectPage");
    } else if (correct.Correctnum >= 3 && response?.reply?.includes("틀렸습니다.")) {
      navigate("/WrongPage");
    }
  }, [response, correct.Correctnum, navigate]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [Chat, isLoading]);

  // 코드 입력/언어
  const [language, setLanguage] = useState('c');

  const initialCCode = `#include <stdio.h>

int main() {
    
    return 0;
}`;

  const initialJavaCode = `public class Main {
    public static void main(String[] args) {
        
    }
}`;

  const [codeText, setCodeText] = useState(initialCCode);
  const handleReset = () => setCodeText(language === 'c' ? initialCCode : initialJavaCode);
  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    setCodeText(newLang === 'c' ? initialCCode : initialJavaCode);
  };
  const handleChange = (e) => setCodeText(e.target.value);

  // 일반 대화/힌트 프록시 (기존 ChatService 경유)
  const sendRequest = async (userMessage) => {
    setIsLoading(true);
    try {
      const res = await fetch("http://localhost:8080/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, message: userMessage }),
      });
      const data = await res.json();
      setResponse(data);

      setChat(prev => [...prev, { type: "left", text: cleanText(data?.reply || JSON.stringify(data, null, 2)) }]);
    } catch (err) {
      console.error("API 호출 실패:", err);
      setChat(prev => [...prev, { type: "left", text: "오류가 발생했습니다." }]);
    } finally {
      setIsLoading(false);
    }
  };

  // ====== 채점 요청(1번 fetch) + 세션 시도/정답 상태 반영 ======
  const RequestDiscrimination = async (userCode, lang) => {
    setIsLoading(true);
    try {
      // 1) 채점 (username, code, language를 body로 한 번에 전송)
      const res = await fetch("http://localhost:8080/api/answers/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          code: userCode,
          language: lang,
        }),
      });
      const text = await res.text();
      setResponse(text);

      // 2) UI 표시
      setChat(prev => [...prev, { type: "left", text: cleanText(text) }]);

      // 3) 세션 시도/정답 마킹
      const sid = sessionStorage.getItem("sessionId");
      if (sid) {
        // 시도 1 증가
        try { await fetch(`http://localhost:8080/api/sessions/${sid}/try`, { method: "POST" }); } catch (_) {}

        // 정답이면 solved 표시
        if (text.includes("정답입니다")) {
          try { await fetch(`http://localhost:8080/api/sessions/${sid}/solve`, { method: "POST" }); } catch (_) {}
        }
      }
    } catch (err) {
      console.error("API 호출 실패:", err);
      setChat(prev => [...prev, { type: "left", text: "오류가 발생했습니다." }]);
    } finally {
      setIsLoading(false);
    }
  };

  // 답 전송
  const [isThinking, setThinking] = useState(false);

  const handleSend = async () => {
    if (codeText.trim() === "") return;
    if (isThinking) return;

    setThinking(true);

    // 내가 보낸 코드 표시
    setChat(prev => [...prev, { type: "right", text: codeText }]);
    correct.setCorrectnum(prev => prev + 1);

    await RequestDiscrimination(codeText, language === 'c' ? "C" : "Java");

    setThinking(false);
  };

  // 힌트
  const setHint = async () => {
    if (hint.Hintnum >= 3 || isThinking) return;

    setThinking(true);

    // 남은 힌트 감소/버튼 비활성 처리
    setB(prev => {
      const next = prev - 1;
      if (next <= 0) SetActive(true);
      return next;
    });

    const showHintNum = hint.Hintnum + 1;
    setChat(prev => [...prev, { type: "right", text: `힌트 ${showHintNum}` }]);

    // 세션 힌트 카운트 증가 (있으면)
    const sid = sessionStorage.getItem("sessionId");
    if (sid) {
      try { await fetch(`http://localhost:8080/api/sessions/${sid}/hint`, { method: "POST" }); } catch (_) {}
    }

    // 실제 힌트 생성은 기존 ChatService에 요청
    await sendRequest(`힌트 ${showHintNum}`);

    hint.setHintnum(prev => prev + 1);
    setThinking(false);
  };

  return (
    <div className="main-wrapper">
      <div className="chat-container">
        {/* 상단 고정 문제 영역 */}
        <div className="notice-container">
          <div 
            className="notice-header" 
            onClick={() => setIsNoticeOpen(!isNoticeOpen)}
          >
            <div className="notice-title">
              <span className="notice-icon">📌</span>
              <span>문제</span>
            </div>
            <span className={`notice-arrow ${isNoticeOpen ? 'open' : ''}`}>▼</span>
          </div>
          
          {isNoticeOpen && (
            <div className="notice-content">
              <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{problemText}</p>
            </div>
          )}
        </div>

        {/* 채팅 영역 */}
        <div className="chat-messages">
          {Chat.map((msg, idx) => (
            <div key={idx} className={`Chat-box ${msg.type}`}>
              <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{msg.text}</p>
            </div>
          ))}

          {isLoading && (
            <div className="Chat-box left loading-box">
              <div className="typing-indicator">
                <span></span><span></span><span></span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>
      </div>

      {/* 코드 입력 영역 */}
      <div className="input-area">
        <p>아래에 답을 입력해보세요! </p>
        <CCodeEditor
          value={codeText}
          onChange={handleChange}
          onReset={handleReset}
          language={language}
          onLanguageChange={handleLanguageChange}
        />
        <div className="SendBtn">
          <button className={`HintBtn ${active ? "active" : ""}`} onClick={setHint}>
            힌트(남은 횟수 {b})
          </button>
          <button className="HintBtn" onClick={handleSend}>답 전송</button>
        </div>
      </div>
    </div>
  );
}
