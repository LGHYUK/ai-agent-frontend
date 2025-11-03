import React, { createContext, useState, useContext } from "react";

//api 서버 답변과 메세지 담는 전역변수만들기.Context 생성
export const ProblemContext = createContext();

// Provider 컴포넌트
export function ProblemProvider({ children }) {
  const [response, setResponse] = useState(null);
  const [message, setMessage] = useState("");

  return (
    <ProblemContext.Provider value={{ response, setResponse, message, setMessage }}>
      {children}
    </ProblemContext.Provider>
  );
}

// 다른 컴포넌트에서 쉽게 접근하기 위한 훅
export function useProblem() {
  return useContext(ProblemContext);
}
