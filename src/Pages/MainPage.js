import React, { useEffect, useState, useRef } from "react";
import "./MainPage.css";
import { useProblem } from "../ProblemContext";
import { useResult } from "../ResultContext";
import CCodeEditor from './CCodeEditor';
import { useNavigate, useLocation } from "react-router-dom";

export default function MainPage() {
  const navigate = useNavigate();
  //다시보기일 경우 정답페이지가 아닌 메인 페이지로 가기 위한 location 변수
  const location = useLocation();
  const { response, setResponse } = useProblem();
  const { hint, correct, timer, level, resetAll, selectedLevel, setSelectedLevel} = useResult(); // 힌트 사용한 횟수,정답 보낸 횟수 ,소요시간 세서 정답 페이지로 보내는 전역변수
  

  const [isLoading, setIsLoading] = useState(false);
  const [isNoticeOpen, setIsNoticeOpen] = useState(true);
  const [problemText, setProblemText] = useState("");
  const [Chat, setChat] = useState([]);
  // 다시보기 시 남은 힌트 횟수가 3으로 초기화되서 나와서 3-(이미 사용한 힌트 횟수)로 수정
  const [b, setB] = useState(() => Math.max(0, 3 - (hint?.Hintnum ?? 0)));
  const [active, SetActive] = useState(false);

  const chatEndRef = useRef(null);

  const userId = 1; // 데모용 고정

  // ✅ 타이머 관련 추가
  const startTimeRef = useRef(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  const startTimer = () => {
    startTimeRef.current = Date.now();
    console.log("⏱️ 타이머 시작!");
  };

  const stopTimer = () => {
    if (startTimeRef.current) {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setElapsedTime(elapsed);
      timer.몇초걸림(elapsed);///전역변수에 저장
      console.log(`⏰ 총 걸린 시간: ${elapsed}초`);
      startTimeRef.current = null;
    }
  };
  // ✅ 끝

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
    //다시보기 모드에서는 타이머 시작 필요 X → replaymode 시 타이머 리셋 X
    const replayMode =
      sessionStorage.getItem("replayMode") === "true" ||
      location.state?.replay;  

     // ✅ 문제 응답일 때만 문제 영역 세팅
    if (response?.isProblem) {
      const text =
        typeof response === "string"
          ? response
          : (response && response.reply) || "";

      setProblemText(cleanText(text));
        if (!replayMode) {
          setChat([]);
          setB(3);
          SetActive(false);
          hint.setHintnum(0);
          correct.setCorrectnum(0);
          // ✅ 타이머 시작
          startTimer();
        }
      }
    }, [response, hint, correct, location]);

  // 정답/오답 페이지 이동
  useEffect(() => {
  // ★ 다시보기 모드인지 확인 코드 추가
    const replayMode =
    sessionStorage.getItem("replayMode") === "true" ||
    location.state?.replay;

    // 다시보기일 땐 정답/오답 페이지로 이동하지 않음
    if (replayMode) return;

    // ✅ 타이머 종료용 함수 호출
    const handleNavigateWithTimer = (path) => {
      stopTimer();
      navigate(path);
    };

    // response 가 객체/문자열 둘 다 올 수 있으면 안전하게 텍스트만 뽑기
    const text =
      typeof response === "string"
        ? response
        : (response && response.reply) || "";

    if (typeof response === 'string' && response.includes("정답입니다.")) {
      handleNavigateWithTimer("/CorrectPage");
    } else if (correct.Correctnum >= 3 && typeof response === 'string' && response.includes("틀렸습니다.")) {
      handleNavigateWithTimer("/WrongPage");
    }

  }, [response, correct.Correctnum, location, selectedLevel, navigate]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [Chat, isLoading]);

  useEffect(() => {
    // 정말 "다시보기"로 온 경우인지 확인
    const replayMode =
      sessionStorage.getItem("replayMode") === "true" ||
      location.state?.replay;

    // 다시보기가 아니라면, 혹시 남아있던 값들 정리하고 그냥 종료
    if (!replayMode) {
      sessionStorage.removeItem("replayMessages");
      sessionStorage.removeItem("replayMode");
      return;
    }

    const stored = sessionStorage.getItem("replayMessages");
    if (!stored) return;

    try {
      const arr = JSON.parse(stored); // JSON 문자열 → 배열

      // 채팅 복원
      const mapped = arr.map((m) => ({
        type: m.role === "user" ? "right" : "left",
        text: m.code ? `${m.content}\n\n${m.code}` : m.content,
      }));
      setChat(mapped);

      // 정답 제출 코드 복원
      const lastUserCodeMsg = [...arr].reverse().find(
        (m) => m.role === "user" && m.code
      );

      if (lastUserCodeMsg?.code) {
        setCodeText(lastUserCodeMsg.code);

        if (lastUserCodeMsg.language === "Java") {
          setLanguage("java");
        } else {
         setLanguage("c");
        }
      }
    } catch (e) {
      console.error("replayMessages 파싱 실패:", e);
    }
    sessionStorage.removeItem("replayMode");
  }, [location]);

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
      const sid = sessionStorage.getItem("sessionId");
      const res = await fetch("http://localhost:8080/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, message: userMessage, sessionId: sid }),
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
      // 1) 채점 (userId, code, language를 body로 한 번에 전송)
      const sid = sessionStorage.getItem("sessionId");   // 문제 받을 때 저장해둔 세션 ID
      const res = await fetch("http://localhost:8080/api/answers/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          code: userCode,
          language: lang,
          sessionId: sid,
        }),
      });
      const text = await res.text();
      setResponse(text);
      console.log("보내는 userId:", userId);
      // 2) UI 표시
      setChat(prev => [...prev, { type: "left", text: cleanText(text) }]);

      // 3) 세션 시도/정답 마킹
      
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

    await RequestDiscrimination(codeText, language === 'c' ? "C" : "Java");
    
    correct.setCorrectnum(prev => prev + 1);
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
