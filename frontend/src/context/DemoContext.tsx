import React, { createContext, useContext, useState, ReactNode } from 'react';
import { DemoScenario } from '../types';

interface DemoContextType {
  scenario: DemoScenario;
  setScenario: (s: DemoScenario) => void;
  referenceMm: number;
  setReferenceMm: (mm: number) => void;
  isAiConnected: boolean;
  setIsAiConnected: (status: boolean) => void;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export const DemoProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [scenario, setScenario] = useState<DemoScenario>('standard');
  const [referenceMm, setReferenceMm] = useState<number>(27.0);
  const [isAiConnected, setIsAiConnected] = useState<boolean>(true);

  return (
    <DemoContext.Provider
      value={{
        scenario,
        setScenario,
        referenceMm,
        setReferenceMm,
        isAiConnected,
        setIsAiConnected
      }}
    >
      {children}
    </DemoContext.Provider>
  );
};

export const useDemo = () => {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error('useDemo must be used within a DemoProvider');
  }
  return context;
};
